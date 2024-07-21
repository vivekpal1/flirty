'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { encryptMessage, decryptMessage } from '@/utils/encryption';
import { io, Socket } from 'socket.io-client';
import { Card, Text, Input, Button } from '@/app/components';
import { toast, Toaster } from 'react-hot-toast';
import { FaSearch } from 'react-icons/fa';

interface Message {
  content: string;
  sender: string;
  recipient: string;
  image?: string;
  timestamp: number;
}

interface Conversation {
  id: number;
  name: string;
  publicKey: string;
  avatar: string;
  lastMessage: string;
}

const ChatContent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const socketRef = useRef<Socket | null>(null);

  const initializeSocket = useCallback(async () => {
    if (wallet.connected && wallet.publicKey) {
      try {
        const response = await fetch('/api/socket');
        if (!response.ok) {
          throw new Error('Failed to initialize socket');
        }

        socketRef.current = io('', {
          path: '/api/socketio',
          addTrailingSlash: false,
        });

        socketRef.current.on('connect', () => {
          console.log('Connected to WebSocket');
          socketRef.current?.emit('join', wallet.publicKey?.toString());
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          toast.error('Failed to connect to chat. Please try again.');
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
                  timestamp: Date.now()
                }
              ]);
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              toast.error('Failed to decrypt a message');
            }
          }
        });

        socketRef.current.on('error', (error) => {
          console.error('Socket error:', error);
          toast.error('An error occurred in the chat. Please try again.');
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Disconnected from WebSocket:', reason);
          toast.error('Disconnected from chat. Attempting to reconnect...');
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
        toast.error('Failed to initialize chat. Please try again.');
      }
    }
  }, [wallet.connected, wallet.publicKey]);

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket]);

  useEffect(() => {
    // Simulated conversations data
    setConversations([
      { id: 1, name: 'Alice', publicKey: 'ALiCeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', avatar: '/avatar1.jpg', lastMessage: 'Hey there!' },
      { id: 2, name: 'Bob', publicKey: 'BobXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', avatar: '/avatar2.jpg', lastMessage: 'How are you?' },
    ]);

    const recipient = searchParams.get('recipient');
    if (recipient) {
      const conversationIndex = conversations.findIndex(conv => conv.publicKey === recipient);
      if (conversationIndex !== -1) {
        setActiveConversation(conversations[conversationIndex].id);
      }
    }
  }, [searchParams, conversations]);

  const sendMessage = async () => {
    if (inputMessage.trim() && wallet.publicKey && activeConversation) {
      setIsLoading(true);
      try {
        const recipient = conversations.find(conv => conv.id === activeConversation)?.publicKey;
        if (!recipient) throw new Error('Recipient not found');

        const encryptedMessage = await encryptMessage(inputMessage, recipient);
        
        const response = await fetch('/api/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: encryptedMessage,
            senderAccount: wallet.publicKey.toString(),
            recipientAccount: recipient,
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
            recipient: recipient,
          });

          setMessages((prevMessages) => [
            ...prevMessages, 
            { 
              content: inputMessage, 
              sender: wallet.publicKey!.toString(),
              recipient: recipient,
              timestamp: Date.now()
            }
          ]);
          setInputMessage('');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const sendImage = async (file: File) => {
    if (file && wallet.publicKey && activeConversation) {
      setIsLoading(true);
      try {
        const recipient = conversations.find(conv => conv.id === activeConversation)?.publicKey;
        if (!recipient) throw new Error('Recipient not found');

        const formData = new FormData();
        formData.append('image', file);
        formData.append('senderAccount', wallet.publicKey.toString());
        formData.append('recipientAccount', recipient);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();

        const encryptedMessage = await encryptMessage('Sent an image', recipient);

        socketRef.current?.emit('message', {
          content: encryptedMessage,
          image: data.imageUrl,
          sender: wallet.publicKey.toString(),
          recipient: recipient,
        });

        setMessages((prevMessages) => [
          ...prevMessages, 
          { 
            content: 'Sent an image', 
            image: data.imageUrl, 
            sender: wallet.publicKey!.toString(),
            recipient: recipient,
            timestamp: Date.now()
          }
        ]);
      } catch (error) {
        console.error('Failed to send image:', error);
        toast.error('Failed to send image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!wallet.connected) {
    return (
      <Card className="flex flex-col items-center justify-center h-screen">
        <Text variant="body" className="mb-4">Please connect your wallet to chat.</Text>
        <WalletMultiButton className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200" />
      </Card>
    );
  }

  const activeConversationData = conversations.find(conv => conv.id === activeConversation);

  return (
    <div className="flex h-screen bg-white">
      <Toaster position="top-right" />
      <div className="w-64 bg-gray-100 border-r border-gray-200">
        <div className="p-4">
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          {filteredConversations.map((conv) => (
            <div 
              key={conv.id} 
              className={`flex items-center p-2 rounded-lg mb-2 cursor-pointer ${activeConversation === conv.id ? 'bg-purple-100' : 'hover:bg-gray-200'}`}
              onClick={() => setActiveConversation(conv.id)}
            >
              <Image src={conv.avatar} alt={conv.name} width={40} height={40} className="rounded-full mr-3" />
              <div>
                <Text variant="subheading">{conv.name}</Text>
                <Text variant="caption" className="text-gray-600">{conv.lastMessage}</Text>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {activeConversationData && (
          <div className="bg-purple-500 text-white p-4 flex items-center">
            <Image src={activeConversationData.avatar} alt="Current chat" width={40} height={40} className="rounded-full mr-3" />
            <Text variant="subheading">{activeConversationData.name}</Text>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === wallet.publicKey?.toString() ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`max-w-[70%] ${msg.sender === wallet.publicKey?.toString() ? 'bg-purple-500 text-white' : 'bg-gray-200'} rounded-lg p-3`}>
                <Text variant="body">{msg.content}</Text>
                {msg.image && (
                  <Image 
                    src={msg.image} 
                    alt="Shared image" 
                    width={200} 
                    height={200} 
                    className="mt-2 rounded-lg"
                  />
                )}
                <Text variant="caption" className="text-xs mt-1 opacity-75">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-4 flex items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && sendImage(e.target.files[0])}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow mr-2"
          />
          <Button onClick={sendMessage} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatContent;