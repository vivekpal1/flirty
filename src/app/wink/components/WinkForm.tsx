import React, { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button, Input, Text } from '@/app/components';

interface WinkFormProps {
  onSubmit: (wink: { image: string; description: string; message: string; bid: string; }) => void;
}

const WinkForm: React.FC<WinkFormProps> = ({ onSubmit }) => {
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [bid, setBid] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallet = useWallet();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) {
      alert('Please connect your wallet first.');
      return;
    }
    onSubmit({ image, description, message, bid });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event triggered');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('File selected:', file.name);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('senderAccount', wallet.publicKey?.toString() || '');
      formData.append('recipientAccount', 'placeholder');

      setIsUploading(true);

      try {
        console.log('Sending upload request');
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload image: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Upload successful, image URL:', data.imageUrl);
        setImage(data.imageUrl);
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } else {
      console.log('No file selected');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          ref={fileInputRef}
        />
        <Button type="button" onClick={handleUploadClick} disabled={isUploading}>
          {isUploading ? 'Uploading...' : image ? 'Change Image' : 'Upload Image'}
        </Button>
        {image && (
          <div className="mt-2">
            <Text variant="caption">Image uploaded successfully</Text>
            <img src={image} alt="Uploaded" className="mt-2 max-w-full h-auto" />
          </div>
        )}
      </div>
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter your Wink description"
        required
      />
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your initial message"
        required
      />
      <Input
        type="number"
        value={bid}
        onChange={(e) => setBid(e.target.value)}
        placeholder="Enter your bid amount in SOL"
        required
        min="0"
        step="0.01"
      />
      <Button type="submit" disabled={!wallet.connected || !image || !description || !message || !bid}>
        Create Wink
      </Button>
    </form>
  );
};

export default WinkForm;