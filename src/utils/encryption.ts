import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { encode as encodeBase64, decode as decodeBase64 } from '@stablelib/base64';

export async function encryptMessage(message: string, recipientPublicKey: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const messageUint8 = encoder.encode(message);
    
    const ephemeralKeypair = nacl.box.keyPair();
    const recipientPubKey = new PublicKey(recipientPublicKey).toBytes();
    
    const sharedKey = nacl.box.before(recipientPubKey, ephemeralKeypair.secretKey);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    
    const encrypted = nacl.box.after(messageUint8, nonce, sharedKey);
    
    const fullMessage = new Uint8Array(nonce.length + ephemeralKeypair.publicKey.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(ephemeralKeypair.publicKey, nonce.length);
    fullMessage.set(encrypted, nonce.length + ephemeralKeypair.publicKey.length);
    
    return encodeBase64(fullMessage);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error encrypting message:', error);
      throw new Error('Failed to encrypt message: ' + error.message);
    } else {
      console.error('Error encrypting message:', error);
      throw new Error('Failed to encrypt message: ' + String(error));
    }
  }
}

export async function decryptMessage(encryptedMessage: string, recipientSecretKey: Uint8Array): Promise<string> {
  try {
    const fullMessage = decodeBase64(encryptedMessage);
    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const ephemeralPublicKey = fullMessage.slice(nacl.box.nonceLength, nacl.box.nonceLength + nacl.box.publicKeyLength);
    const ciphertext = fullMessage.slice(nacl.box.nonceLength + nacl.box.publicKeyLength);
    
    const sharedKey = nacl.box.before(ephemeralPublicKey, recipientSecretKey);
    const decrypted = nacl.box.open.after(ciphertext, nonce, sharedKey);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt message');
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error decrypting message:', error);
      throw new Error('Failed to decrypt message: ' + error.message);
    } else {
      console.error('Error decrypting message:', error);
      throw new Error('Failed to decrypt message: ' + String(error));
    }
  }
}