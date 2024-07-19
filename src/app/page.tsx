'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [blinkUrl, setBlinkUrl] = useState('');
  const wallet = useWallet();

  const generateBlinkUrl = () => {
    if (!message) {
      alert('Please enter a message');
      return;
    }

    const baseUrl = `${window.location.origin}/api/actions/flirt`;
    const params = new URLSearchParams({
      message: message,
      ...(imageUrl && { image: imageUrl }),
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    setBlinkUrl(`solana-action:${encodeURIComponent(fullUrl)}`);
  };

  const openBlink = () => {
    if (blinkUrl) {
      window.open(blinkUrl, '_blank');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Flirty Blink Generator</h1>
      
      <div className="mb-4">
        <WalletMultiButton />
      </div>

      {wallet.connected ? (
        <>
          <div className="mb-4">
            <label className="block mb-2">Flirty Message:</label>
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your flirty message"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Image URL (optional):</label>
            <input 
              type="text" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter an image URL"
            />
          </div>

          <button 
            onClick={generateBlinkUrl}
            className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          >
            Generate Blink URL
          </button>

          {blinkUrl && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-2">Your Blink URL:</h2>
              <p className="break-all bg-gray-100 p-2 rounded">{blinkUrl}</p>
              <button 
                onClick={openBlink}
                className="bg-green-500 text-white px-4 py-2 rounded mt-2"
              >
                Open Blink
              </button>
            </div>
          )}
        </>
      ) : (
        <p>Please connect your wallet to generate a blink.</p>
      )}
    </div>
  );
}