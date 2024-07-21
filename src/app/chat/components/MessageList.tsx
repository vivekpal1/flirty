import React from 'react';
import Image from 'next/image';
import { Text } from '@/app/components';

interface Message {
  content: string;
  sender: string;
  image?: string;
  timestamp: number;
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => (
  <div className="flex-1 overflow-y-auto p-4">
    {messages.map((msg, index) => (
      <div key={index} className={`flex ${msg.sender === currentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${msg.sender === currentUser ? 'bg-purple-500 text-white' : 'bg-gray-200'} rounded-lg p-3`}>
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
);

export default MessageList;