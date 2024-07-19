import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { FLIRTY_PROGRAM_ID } from "@/const";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, senderAccount } = await req.json();

    if (!message || !senderAccount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = new Connection(process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com");

    const transaction = new Transaction();

    transaction.add(
      new TransactionInstruction({
        keys: [
          { pubkey: new PublicKey(senderAccount), isSigner: true, isWritable: true },
        ],
        programId: FLIRTY_PROGRAM_ID,
        data: Buffer.from(JSON.stringify({ 
          action: "sendMessage",
          message, 
        }), "utf8"),
      })
    );

    transaction.feePayer = new PublicKey(senderAccount);
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const serializedTransaction = transaction.serialize({requireAllSignatures: false}).toString('base64');

    return NextResponse.json({ transaction: serializedTransaction });
  } catch (error) {
    console.error('Error in send-message route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}