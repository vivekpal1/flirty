import React from 'react';
import Image from 'next/image';
import { Card, Text } from '@/app/components';

interface WinkPreviewProps {
  image: string;
  description: string;
  message: string;
  blinkUrl: string;
}

const WinkPreview: React.FC<WinkPreviewProps> = ({ image, description, message, blinkUrl }) => {
  const shareOnTwitter = () => {
    const tweetText = encodeURIComponent(`Check out my new Wink: ${description}\n\n${blinkUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  return (
    <Card className="p-4 space-y-4">
      <Text variant="heading">Your Wink Preview</Text>
      {image && (
        <div className="relative h-48 w-full">
          <Image src={image} alt="Wink image" layout="fill" objectFit="cover" className="rounded-lg" />
        </div>
      )}
      <Text variant="subheading">Description:</Text>
      <Text variant="body">{description}</Text>
      <Text variant="subheading">Initial Message:</Text>
      <Text variant="body">{message}</Text>
      <Text variant="caption">Blink URL: {blinkUrl}</Text>
      <button
        onClick={shareOnTwitter}
        className="bg-[#1DA1F2] text-white font-bold py-2 px-4 rounded hover:bg-[#1a91da] transition duration-200"
      >
        Share on X (Twitter)
      </button>
    </Card>
  );
};

export default WinkPreview;