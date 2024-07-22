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
    const requestUrl = new URL(req.url);
    const baseHref = new URL("/api/actions/wink", requestUrl.origin).toString();

    const payload: ActionGetResponse = {
      title: "Interact with a Wink",
      icon: "https://winked.vercel.app/wink-icon.png",
      description: "Send a message and bid on a Wink!",
      label: "Send Message",
      links: {
        actions: [
          {
            label: "Send Message and Bid", 
            href: `${baseHref}?winkId={winkId}&message={message}&bid={bid}`,
            parameters: [
              {
                name: "winkId",
                label: "Wink ID",
                required: true,
              },
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
    const { winkId, message, bid } = validatedQueryParams(searchParams);

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
          action: "interactWithWink",
          winkId,
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
        message: `Interacting with Wink ${winkId}: "${message}" with bid: ${bid} SOL`,
      },
    });

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

function validatedQueryParams(searchParams: URLSearchParams) {
  let winkId: string = searchParams.get("winkId") || "";
  let message: string = searchParams.get("message") || "";
  let bid: string = searchParams.get("bid") || "";

  if (!winkId) throw "Wink ID is required";
  if (!message) throw "Message is required";
  if (!bid || isNaN(parseFloat(bid))) throw "Bid must be a valid number";

  return {
    winkId: decodeURIComponent(winkId),
    message: decodeURIComponent(message),
    bid,
  };
}