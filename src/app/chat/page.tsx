'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import ChatFrame from '@/app/components/ui/ChatFrame';

const ChatContent = dynamic(() => import('./ChatContent'), { ssr: false });

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatFrame>
        <ChatContent />
      </ChatFrame>
    </Suspense>
  );
}