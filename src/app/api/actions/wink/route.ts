import { NextResponse } from 'next/server';
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { WINK_PROGRAM_ID } from "@/const";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const twitterId = searchParams.get('twitterId') || '';
    const description = searchParams.get('description') || '';

    const payload: ActionGetResponse = {
      title: "Interact with a Twitter User",
      icon: 'https://winked.vercel.app/bg.png',
      description: description,
      label: "Send Message and Bid",
      links: {
        actions: [
          {
            label: "Send Message and Bid", 
            href: `${req.url}&message={message}&bid={bid}`,
            parameters: [
              {
                name: "message",
                label: "Your message",
                required: true,
              },
              {
                name: "bid",
                label: "Bid amount in SOL",
                required: true,
              },
            ],
          },
        ],
      },
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in GET handler:', err);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred', 
      details: err instanceof Error ? err.message : String(err) 
    }), {
      status: 500,
      headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
};

export const OPTIONS = async (req: Request) => {
  return NextResponse.json({}, { headers: ACTIONS_CORS_HEADERS });
};

export const POST = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const { twitterId, message, bid } = validatedQueryParams(searchParams);

    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      console.error('Invalid account:', err);
      return new Response(JSON.stringify({ error: 'Invalid "account" provided' }), {
        status: 400,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const connection = new Connection(process.env.SOLANA_RPC || "https://api.devnet.solana.com");

    try {
      await connection.getVersion();
    } catch (err) {
      console.error('Error connecting to Solana network:', err);
      return new Response(JSON.stringify({ error: 'Unable to connect to Solana network' }), {
        status: 500,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const transaction = new Transaction();

    const bidLamports = Math.floor(parseFloat(bid) * LAMPORTS_PER_SOL);

    try {
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: account, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: WINK_PROGRAM_ID,
          data: Buffer.from(JSON.stringify({ 
            action: "interactWithTwitterUser",
            twitterId,
            message,
            bid: bidLamports,
          }), "utf8"),
        })
      );
    } catch (err) {
      console.error('Error adding instruction to transaction:', err);
      return new Response(JSON.stringify({ error: 'Error creating transaction' }), {
        status: 500,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    transaction.feePayer = account;

    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
    } catch (err) {
      console.error('Error getting recent blockhash:', err);
      return new Response(JSON.stringify({ error: 'Error getting recent blockhash' }), {
        status: 500,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    let payload: ActionPostResponse;
    try {
      payload = await createPostResponse({
        fields: {
          transaction,
          message: `Interacting with Twitter user ${twitterId}: "${message}" with bid: ${bid} SOL`,
        },
      });
    } catch (err) {
      console.error('Error creating post response:', err);
      return new Response(JSON.stringify({ error: 'Error creating post response' }), {
        status: 500,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const chatUrl = new URL("/chat", req.url);
    chatUrl.searchParams.set("twitterId", twitterId);
    chatUrl.searchParams.set("message", message);
    chatUrl.searchParams.set("bid", bid);

    return new Response(JSON.stringify({
      ...payload,
      redirectUrl: chatUrl.toString(),
    }), {
      headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error in POST handler:', err);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred', 
      details: err instanceof Error ? err.message : String(err) 
    }), {
      status: 500,
      headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
};

function validatedQueryParams(searchParams: URLSearchParams) {
  let twitterId: string = searchParams.get("twitterId") || "";
  let message: string = searchParams.get("message") || "";
  let bid: string = searchParams.get("bid") || "";

  if (!twitterId) throw new Error("Twitter ID is required");
  if (!message) throw new Error("Message is required");
  if (!bid || isNaN(parseFloat(bid))) throw new Error("Bid must be a valid number");

  return {
    twitterId: decodeURIComponent(twitterId),
    message: decodeURIComponent(message),
    bid,
  };
}