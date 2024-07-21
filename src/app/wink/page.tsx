'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { encodeURL } from '@solana/actions';
import { Card, Text } from '@/app/components';
import WinkForm from './components/WinkForm';
import WinkPreview from './components/WinkPreview';

const WinkCreationPage = () => {
  const [wink, setWink] = useState<{ image: string; description: string; message: string; } | null>(null);
  const [blinkUrl, setBlinkUrl] = useState<string | null>(null);
  const wallet = useWallet();

  const handleWinkSubmit = async (winkData: { image: string; description: string; message: string; }) => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com');
      
      // Create a transaction for the Wink
      const transaction = new Transaction().add(
        // Add your program instruction here
      );

      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Create the Solana Action URL
      const url = encodeURL({
        link: new URL(`${window.location.origin}/api/actions/wink`),
        label: "Create Wink",
      });

      // Create the blink URL
      const blinkUrl = `${window.location.origin}/?action=${encodeURIComponent(url.toString())}`;

      setWink(winkData);
      setBlinkUrl(blinkUrl);
    } catch (error) {
      console.error('Failed to create Wink:', error);
      alert('Failed to create Wink. Please try again.');
    }
  };

  if (!wallet.connected) {
    return (
      <Card className="flex flex-col items-center justify-center h-screen">
        <Text variant="body" className="mb-4">Please connect your wallet to create a Wink.</Text>
        <WalletMultiButton className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200" />
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Text variant="heading" className="mb-6 text-center">Create Your Wink</Text>
      {!wink ? (
        <WinkForm onSubmit={handleWinkSubmit} />
      ) : (
        <WinkPreview
          image={wink.image}
          description={wink.description}
          message={wink.message}
          blinkUrl={blinkUrl || ''}
        />
      )}
    </div>
  );
};

export default WinkCreationPage;