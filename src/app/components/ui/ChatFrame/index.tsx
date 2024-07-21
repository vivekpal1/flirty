import React from 'react';

interface ChatFrameProps {
  children: React.ReactNode;
}

const ChatFrame: React.FC<ChatFrameProps> = ({ children }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-purple-500 text-white p-4">
        <h2 className="text-xl font-bold">Wink Chat</h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default ChatFrame;