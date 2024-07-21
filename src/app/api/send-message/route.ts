import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createPostResponse, getActionIdentityFromEnv } from '@/utils/actionIdentity';
import { SystemProgram } from '@solana/web3.js';

export async function POST(req: NextRequest) {
  try {
    const { message, senderAccount, recipientAccount } = await req.json();

    if (!message || !senderAccount || !recipientAccount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com');

    const transaction = new Transaction();

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(senderAccount),
        toPubkey: new PublicKey(recipientAccount),
        lamports: 100000,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    transaction.feePayer = new PublicKey(senderAccount);

    try {
      const actionIdentity = getActionIdentityFromEnv();

      const response = await createPostResponse({
        fields: {
          transaction,
          message: 'Message sent successfully',
        },
        actionIdentity,
      });

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error creating post response:', error);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

