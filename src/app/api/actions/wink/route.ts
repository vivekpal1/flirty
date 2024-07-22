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

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.error('Error in GET handler:', err);
    if (err instanceof Error) {
      return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: err.message }), {
        status: 500,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
        status: 500,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  }
};

export const OPTIONS = GET;

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
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const connection = new Connection(process.env.SOLANA_RPC || "https://api.devnet.solana.com");

    try {
      await connection.getVersion();
    } catch (err) {
      console.error('Error connecting to Solana network:', err);
      return new Response('Unable to connect to Solana network', {
        status: 500,
        headers: ACTIONS_CORS_HEADERS,
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
      throw err;
    }

    transaction.feePayer = account;

    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
    } catch (err) {
      console.error('Error getting recent blockhash:', err);
      throw err;
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
      throw err;
    }

    const chatUrl = new URL("/chat", req.url);
    chatUrl.searchParams.set("twitterId", twitterId);
    chatUrl.searchParams.set("message", message);
    chatUrl.searchParams.set("bid", bid);

    return Response.json({
      ...payload,
      redirectUrl: chatUrl.toString(),
    }, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.error('Unexpected error in POST handler:', err);
    if (err instanceof Error) {
      return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: err.message }), {
        status: 500,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
        status: 500,
        headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  }
};

function validatedQueryParams(searchParams: URLSearchParams) {
  let twitterId: string = searchParams.get("twitterId") || "";
  let message: string = searchParams.get("message") || "";
  let bid: string = searchParams.get("bid") || "";

  if (!twitterId) throw "Twitter ID is required";
  if (!message) throw "Message is required";
  if (!bid || isNaN(parseFloat(bid))) throw "Bid must be a valid number";

  return {
    twitterId: decodeURIComponent(twitterId),
    message: decodeURIComponent(message),
    bid,
  };
}