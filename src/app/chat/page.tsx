'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ChatContent = dynamic(() => import('./ChatContent'), { ssr: false });

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}