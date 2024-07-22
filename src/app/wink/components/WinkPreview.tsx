import React from 'react';
import Image from 'next/image';
import { Card, Text, Button } from '@/app/components';

interface WinkPreviewProps {
  image: string;
  description: string;
  message: string;
  bid: string;
}

const WinkPreview: React.FC<WinkPreviewProps> = ({ image, description, message, bid }) => {
  return (
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">Wink Preview</h2>
      {image && (
        <img src={image} alt="Wink" className="mb-4 rounded-lg max-w-full h-auto" />
      )}
      <Text variant="body" className="mb-2">Description: {description}</Text>
      <Text variant="body" className="mb-2">Initial Message: {message}</Text>
      <Text variant="body" className="mb-2">Bid: {bid} SOL</Text>
    </Card>
  );
};

export default WinkPreview;