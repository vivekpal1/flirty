'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { encryptMessage, decryptMessage } from '@/utils/encryption';
import { io, Socket } from 'socket.io-client';
import { Button, Input, Text, Card } from '@/app/components';

interface Message {
  content: string;
  sender: string;
  image?: string;
  timestamp: number;
}

const MessageList = ({ messages, currentUser }: { messages: Message[], currentUser: string }) => (
  <div className="bg-gray-100 p-4 h-96 overflow-y-auto mb-4 rounded-lg shadow">
    {messages.map((msg, index) => (
      <div key={index} className={`mb-4 ${msg.sender === currentUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block p-2 rounded-lg ${msg.sender === currentUser ? 'bg-purple-500 text-white' : 'bg-white'}`}>
          <Text variant="body">{msg.content}</Text>
          {msg.image && (
            <div className="mt-2">
              <Image 
                src={msg.image} 
                alt="Shared image" 
                width={200} 
                height={200} 
                className="rounded-lg shadow"
              />
            </div>
          )}
          <Text variant="caption" className="text-xs mt-1 opacity-75">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </Text>
        </div>
      </div>
    ))}
  </div>
);

const MessageInput = ({ 
  inputMessage, 
  setInputMessage, 
  sendMessage,
  sendImage
}: { 
  inputMessage: string, 
  setInputMessage: (message: string) => void, 
  sendMessage: () => void,
  sendImage: (file: File) => void
}) => (
  <div className="flex flex-col space-y-2">
    <div className="flex space-x-2">
      <Input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-grow"
      />
      <Button onClick={sendMessage}>
        Send
      </Button>
    </div>
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && sendImage(e.target.files[0])}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <Button onClick={() => {}} className="w-full">
          Send Image
        </Button>
      </label>
    </div>
  </div>
);

const ChatContent = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const socketRef = useRef<Socket | null>(null);
  const recipientRef = useRef<string | null>(null);

  useEffect(() => {
    const recipient = searchParams.get('recipient');
    if (recipient) {
      recipientRef.current = recipient;
    }
  
    if (wallet.connected && recipient && wallet.publicKey) {
      const socketInitializer = async () => {
        await fetch('/api/socket');
        socketRef.current = io('', {
          path: '/api/socket',
          addTrailingSlash: false,
        });
  
        socketRef.current.on('connect', () => {
          console.log('Connected to WebSocket');
          socketRef.current?.emit('join', wallet.publicKey?.toString());
        });
  
        socketRef.current.on('message', async (message: Message) => {
          if (wallet.publicKey) {
            try {
              const decryptedContent = await decryptMessage(message.content, wallet.publicKey.toBytes());
              setMessages((prevMessages) => [
                ...prevMessages, 
                {
                  ...message,
                  content: decryptedContent,
                  sender: message.sender === wallet.publicKey?.toString() ? 'You' : 'Other',
                  timestamp: Date.now()
                }
              ]);
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              setMessages((prevMessages) => [
                ...prevMessages, 
                {
                  ...message,
                  content: 'Unable to decrypt message',
                  sender: message.sender === wallet.publicKey?.toString() ? 'You' : 'Other',
                  timestamp: Date.now()
                }
              ]);
            }
          }
        });

        socketRef.current.on('error', (error) => {
          console.error('Socket error:', error);
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Disconnected from WebSocket:', reason);
        });
      };

      socketInitializer();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [wallet.connected, searchParams, wallet.publicKey]);

  const sendMessage = async () => {
    if (inputMessage.trim() && wallet.publicKey && recipientRef.current) {
      try {
        const recipientPublicKey = new PublicKey(recipientRef.current);
        const encryptedMessage = await encryptMessage(inputMessage, recipientPublicKey.toBase58());
        
        const response = await fetch('/api/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: encryptedMessage,
            senderAccount: wallet.publicKey.toString(),
            recipientAccount: recipientRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));

        if (wallet.signTransaction) {
          const signedTransaction = await wallet.signTransaction(transaction);
          const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com");
          const signature = await connection.sendRawTransaction(signedTransaction.serialize());
          await connection.confirmTransaction(signature);

          socketRef.current?.emit('message', {
            content: encryptedMessage,
            sender: wallet.publicKey.toString(),
            recipient: recipientRef.current,
          });

          setMessages((prevMessages) => [
            ...prevMessages, 
            { 
              content: inputMessage, 
              sender: wallet.publicKey!.toString(),
              timestamp: Date.now()
            }
          ]);
          setInputMessage('');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message. Please check the recipient\'s public key.');
      }
    }
  };

  const sendImage = async (file: File) => {
    if (file && wallet.publicKey && recipientRef.current) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('senderAccount', wallet.publicKey.toString());
        formData.append('recipientAccount', recipientRef.current);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();

        // Encrypt a message to go along with the image
        const recipientPublicKey = new PublicKey(recipientRef.current);
        const encryptedMessage = await encryptMessage('Sent an image', recipientPublicKey.toBase58());

        socketRef.current?.emit('message', {
          content: encryptedMessage,
          image: data.imageUrl,
          sender: wallet.publicKey.toString(),
          recipient: recipientRef.current,
        });

        setMessages((prevMessages) => [
          ...prevMessages, 
          { 
            content: 'Sent an image', 
            image: data.imageUrl, 
            sender: wallet.publicKey!.toString(),
            timestamp: Date.now()
          }
        ]);
      } catch (error) {
        console.error('Failed to send image:', error);
        alert('Failed to send image. Please try again.');
      }
    }
  };

  if (!wallet.connected) {
    return (
      <Card className="flex flex-col items-center justify-center h-screen">
        <Text variant="body" className="mb-4">Please connect your wallet to chat.</Text>
        <WalletMultiButton className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200" />
      </Card>
    );
  }

  return (
    <Card className="container mx-auto p-4 max-w-2xl">
      <Text variant="heading" className="mb-6 text-center">Wink Private Chat</Text>
      {recipientRef.current && (
        <Text variant="body" className="mb-4 text-center text-gray-600">Chatting with: {recipientRef.current}</Text>
      )}
      <MessageList messages={messages} currentUser={wallet.publicKey?.toString() || ''} />
      <MessageInput 
        inputMessage={inputMessage} 
        setInputMessage={setInputMessage} 
        sendMessage={sendMessage}
        sendImage={sendImage}
      />
    </Card>
  );
};

export default ChatContent;