'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FaHome, FaEdit, FaComment, FaCog } from 'react-icons/fa';
import { useTwitterUser } from '@/hooks/useTwitterUser';

const Sidebar = () => {
  const pathname = usePathname();
  const twitterUser = useTwitterUser();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-16 bg-purple-600 h-screen flex flex-col items-center py-4">
      {twitterUser && (
        <div className="mb-8">
          <Image 
            src={twitterUser.profileImageUrl} 
            alt={twitterUser.name} 
            width={40} 
            height={40} 
            className="rounded-full"
          />
        </div>
      )}
      <Link href="/" className={`mb-6 ${isActive('/') ? 'text-white' : 'text-purple-300'}`}>
        <FaHome size={24} />
      </Link>
      <Link href="/wink" className={`mb-6 ${isActive('/wink') ? 'text-white' : 'text-purple-300'}`}>
        <FaEdit size={24} />
      </Link>
      <Link href="/chat" className={`mb-6 ${isActive('/chat') ? 'text-white' : 'text-purple-300'}`}>
        <FaComment size={24} />
      </Link>
      <div className="flex-grow" />
      <Link href="/settings" className={`mb-6 ${isActive('/settings') ? 'text-white' : 'text-purple-300'}`}>
        <FaCog size={24} />
      </Link>
    </div>
  );
};

export default Sidebar;