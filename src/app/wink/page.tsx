'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card, Text, Button } from '@/app/components';
import WinkForm from './components/WinkForm';
import WinkPreview from './components/WinkPreview';

const WinkCreationPage: React.FC = () => {
  const [wink, setWink] = useState<{ image: string; description: string; message: string; bid: string; } | null>(null);
  const [blinkUrl, setBlinkUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const wallet = useWallet();

  const handleWinkSubmit = async (winkData: { image: string; description: string; message: string; bid: string; }) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com');
      
      const receiverPublicKey = new PublicKey('vivgdu332GMEk3FaupQa92gQjYd9LX6TMgjMVsLaCu4');
      const bidAmount = parseFloat(winkData.bid) * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: receiverPublicKey,
          lamports: bidAmount,
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = wallet.publicKey;

      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      const actionUrl = new URL(`${window.location.origin}/api/actions/wink/create`);
      actionUrl.searchParams.append('image', winkData.image);
      actionUrl.searchParams.append('description', winkData.description);
      actionUrl.searchParams.append('message', winkData.message);
      actionUrl.searchParams.append('bid', winkData.bid);
      actionUrl.searchParams.append('recipient', wallet.publicKey.toString());

      const encodedActionUrl = encodeURIComponent(`solana-action:${actionUrl.toString()}`);
      const generatedBlinkUrl = `${window.location.origin}/chat?action=${encodedActionUrl}`;

      setWink(winkData);
      setBlinkUrl(generatedBlinkUrl);
    } catch (error) {
      console.error('Failed to create Wink:', error);
      alert('Failed to create Wink. Please ensure you have enough SOL to cover the bid and transaction fees.');
    }
  };

  const handleCopyUrl = () => {
    if (blinkUrl) {
      navigator.clipboard.writeText(blinkUrl)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => console.error('Failed to copy URL: ', err));
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
        <div>
          <WinkPreview
            image={wink.image}
            description={wink.description}
            message={wink.message}
            bid={wink.bid}
          />
          {blinkUrl && (
            <div className="mt-4">
              <Text variant="subheading" className="mb-2">Your Wink URL:</Text>
              <div className="flex items-center">
                <input
                  type="text"
                  value={blinkUrl}
                  readOnly
                  className="flex-grow p-2 border rounded-l"
                />
                <Button
                  onClick={handleCopyUrl}
                  className="rounded-l-none"
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WinkCreationPage;