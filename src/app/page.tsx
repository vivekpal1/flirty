'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button, Text } from '@/app/components';

const LandingPage = () => {
  const router = useRouter();
  const wallet = useWallet();

  const navigateToWinkCreation = () => {
    router.push('/wink');
  };

  const navigateToChats = () => {
    router.push('/chat');
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center backdrop-filter bg-black bg-opacity-60 backdrop-blur-lg">
      <video
        autoPlay
        loop
        muted
        className="absolute z-0 w-auto min-w-full min-h-full max-w-none"
      >
        <source src="/bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="relative z-10 text-white text-center">
        <div className="bg-black bg-opacity-50 p-8 rounded-lg backdrop-filter backdrop-blur-sm">
          <h1 className="text-5xl font-bold mb-6 font-serif">Wink</h1>
          <p className="text-2xl italic mb-8 font-light">
          &quot;in the digital age, a wink is worth a thousand words&quot;
          </p>
          
          {wallet.connected ? (
            <div className="space-y-4">
              <Button
                onClick={navigateToWinkCreation}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
              >
                Create a Wink
              </Button>
              <Button
                onClick={navigateToChats}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
              >
                Your Chats
              </Button>
            </div>
          ) : (
            <div>
              <Text variant="body" className="mb-4">Connect your wallet to get started</Text>
              <WalletMultiButton className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;