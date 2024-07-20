'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const wallet = useWallet();
  const router = useRouter();

  const startChat = () => {
    if (!recipientPublicKey) {
      alert('Please enter a recipient public key');
      return;
    }

    router.push(`/chat?recipient=${recipientPublicKey}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Flirty P2P Chat</h1>
      
      <div className="mb-4">
        <WalletMultiButton />
      </div>

      {wallet.connected ? (
        <>
          <div className="mb-4">
            <label className="block mb-2">Recipient&apos;s Public Key:</label>
            <input 
              type="text"
              value={recipientPublicKey} 
              onChange={(e) => setRecipientPublicKey(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter recipient&apos;s public key"
            />
          </div>

          <button 
            onClick={startChat}
            className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          >
            Start Chat
          </button>
        </>
      ) : (
        <p>Please connect your wallet to start chatting.</p>
      )}
    </div>
  );
}