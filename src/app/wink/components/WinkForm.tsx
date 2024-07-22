import React, { useState } from 'react';
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);
      formData.append('senderAccount', wallet.publicKey?.toString() || '');
      formData.append('recipientAccount', 'placeholder');

      setIsUploading(true);

      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        setImage(data.imageUrl);
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button type="button" disabled={isUploading}>
            {isUploading ? 'Uploading...' : image ? 'Change Image' : 'Upload Image'}
          </Button>
        </label>
        {image && <Text variant="caption">Image uploaded successfully</Text>}
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