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
      title: "Create a Wink",
      icon: "https://winked.vercel.app/wink-icon.png",
      description: "Create a Wink and start a chat!",
      label: "Wink",
      links: {
        actions: [
          {
            label: "Create Wink", 
            href: `${baseHref}?image={image}&description={description}&message={message}&bid={bid}`,
            parameters: [
              {
                name: "image",
                label: "URL of your image",
                required: true,
              },
              {
                name: "description",
                label: "Wink description",
                required: true,
              },
              {
                name: "message",
                label: "Your initial message",
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
    const requestUrl = new URL(req.url);
    const { image, description, message, bid } = validatedQueryParams(requestUrl);

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
          action: "createWink",
          image,
          description,
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
        message: `Creating Wink: "${description}" with initial message: "${message}" and bid: ${bid} SOL`,
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

function validatedQueryParams(requestUrl: URL) {
  let image: string = "";
  let description: string = "";
  let message: string = "";
  let bid: string = "";

  if (requestUrl.searchParams.get("image")) {
    image = decodeURIComponent(requestUrl.searchParams.get("image")!);
  } else {
    throw "Image URL is required";
  }

  if (requestUrl.searchParams.get("description")) {
    description = decodeURIComponent(requestUrl.searchParams.get("description")!);
  } else {
    throw "Description is required";
  }

  if (requestUrl.searchParams.get("message")) {
    message = decodeURIComponent(requestUrl.searchParams.get("message")!);
  } else {
    throw "Message is required";
  }

  if (requestUrl.searchParams.get("bid")) {
    bid = decodeURIComponent(requestUrl.searchParams.get("bid")!);
    if (isNaN(parseFloat(bid))) {
      throw "Bid must be a valid number";
    }
  } else {
    throw "Bid is required";
  }

  return {
    image,
    description,
    message,
    bid,
  };
}