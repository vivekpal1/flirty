import React from 'react';
import Image from 'next/image';
import { Card, Text, Button } from '@/app/components';

interface WinkPreviewProps {
  image: string;
  description: string;
  message: string;
  bid: string;
  blinkUrl: string;
}

const WinkPreview: React.FC<WinkPreviewProps> = ({ image, description, message, bid, blinkUrl }) => {
  return (
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">Wink Preview</h2>
      {image && (
        <Image src={image} alt="Wink" width={300} height={300} className="mb-4 rounded-lg" />
      )}
      <Text variant="body" className="mb-2">Description: {description}</Text>
      <Text variant="body" className="mb-2">Initial Message: {message}</Text>
      <Text variant="body" className="mb-2">Bid: {bid} SOL</Text>
      <Button onClick={() => window.open(blinkUrl, '_blank')}>Open Wink</Button>
    </Card>
  );
};

export default WinkPreview;