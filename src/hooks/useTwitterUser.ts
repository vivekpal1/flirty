import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profileImageUrl: string;
}

export const useTwitterUser = () => {
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const { publicKey } = useWallet();

  useEffect(() => {
    const fetchTwitterUser = async () => {
      if (publicKey) {
        try {
          const response = await fetch(`/api/twitter-user?publicKey=${publicKey.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setTwitterUser(data);
          }
        } catch (error) {
          console.error('Failed to fetch Twitter user data:', error);
        }
      }
    };

    fetchTwitterUser();
  }, [publicKey]);

  return twitterUser;
};