import { NextRequest, NextResponse } from 'next/server';
import { Connection, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { getActionIdentityFromEnv, createPostResponse } from '../../../utils/actionIdentity';

export async function POST(request: NextRequest) {
  const { message, senderAccount, recipientAccount } = await request.json();

  if (!message || !senderAccount || !recipientAccount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    const sender = new PublicKey(senderAccount);
    const recipient = new PublicKey(recipientAccount);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports: 1000, // Small amount for demonstration
      })
    );

    const actionIdentity = getActionIdentityFromEnv();
    const postResponse = await createPostResponse({
      fields: {
        transaction,
        message: 'Message sent successfully',
      },
      actionIdentity,
    });

    return NextResponse.json(postResponse);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}