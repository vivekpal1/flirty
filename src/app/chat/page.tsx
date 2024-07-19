'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction } from '@solana/web3.js';

const MessageList = ({ messages }: { messages: string[] }) => (
  <div className="bg-gray-100 p-4 h-64 overflow-y-auto mb-4">
    {messages.map((msg, index) => (
      <div key={index} className="mb-2">
        {msg}
      </div>
    ))}
  </div>
);

const MessageInput = ({ 
  inputMessage, 
  setInputMessage, 
  sendMessage 
}: { 
  inputMessage: string, 
  setInputMessage: (message: string) => void, 
  sendMessage: () => void 
}) => (
  <div className="flex">
    <input
      type="text"
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      className="flex-grow border p-2 mr-2"
      placeholder="Type your message..."
    />
    <button
      onClick={sendMessage}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Send
    </button>
  </div>
);

const ChatContent = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const searchParams = useSearchParams();
  const wallet = useWallet();

  useEffect(() => {
    const initialMessage = searchParams.get('message');
    if (initialMessage) {
      setMessages([initialMessage]);
    }
  }, [searchParams]);

  const sendMessage = async () => {
    if (inputMessage.trim() && wallet.publicKey) {
      try {
        const response = await fetch('/api/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            senderAccount: wallet.publicKey.toString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));

        if (wallet.signTransaction) {
          const signedTransaction = await wallet.signTransaction(transaction);
          const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com");
          const signature = await connection.sendRawTransaction(signedTransaction.serialize());
          await connection.confirmTransaction(signature);

          setMessages([...messages, inputMessage]);
          setInputMessage('');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  if (!wallet.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="mb-4">Please connect your wallet to chat.</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Flirty Chat</h1>
      <MessageList messages={messages} />
      <MessageInput 
        inputMessage={inputMessage} 
        setInputMessage={setInputMessage} 
        sendMessage={sendMessage} 
      />
    </div>
  );
};

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}