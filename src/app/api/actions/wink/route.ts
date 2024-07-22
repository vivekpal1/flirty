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
    const image = searchParams.get('image') || '';
    const description = searchParams.get('description') || '';

    const payload: ActionGetResponse = {
      title: "Interact with a Twitter User",
      icon: image,
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
    console.error(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
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
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const connection = new Connection(process.env.SOLANA_RPC || "https://api.devnet.solana.com");

    const transaction = new Transaction();

    const bidLamports = Math.floor(parseFloat(bid) * LAMPORTS_PER_SOL);

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

    transaction.feePayer = account;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Interacting with Twitter user ${twitterId}: "${message}" with bid: ${bid} SOL`,
      },
    });

    // Add a redirect URL to the chat app
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
    console.error(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
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