import React from 'react';
import { Button, Input } from '@/app/components';

interface MessageInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
  sendImage: (file: File) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  inputMessage, 
  setInputMessage, 
  sendMessage,
  sendImage
}) => (
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
    <Button onClick={sendMessage}>
      Send
    </Button>
  </div>
);

export default MessageInput;