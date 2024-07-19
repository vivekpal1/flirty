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
} from "@solana/web3.js";
import { FLIRTY_PROGRAM_ID } from "@/const";

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const baseHref = new URL("/api/actions/flirt", requestUrl.origin).toString();

    const payload: ActionGetResponse = {
      title: "Get Your Hands Flirty",
      icon: "https://flirty.ink/flirty-icon.png",
      description: "Send a flirty message and open a chat!",
      label: "Flirt",
      links: {
        actions: [
          {
            label: "Send Your Message", 
            href: `${baseHref}?message={message}&image={image}`,
            parameters: [
              {
                name: "message",
                label: "Your message",
                required: true,
              },
              {
                name: "image",
                label: "URL of your image",
                required: false,
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
    const { message, image } = validatedQueryParams(requestUrl);

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

    const connection = new Connection(process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com");

    const transaction = new Transaction();

    transaction.add(
      new TransactionInstruction({
        keys: [
          { pubkey: account, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: FLIRTY_PROGRAM_ID,
        data: Buffer.from(JSON.stringify({ 
          action: "initChat",
          message, 
          image 
        }), "utf8"),
      })
    );

    transaction.feePayer = account;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Initializing chat with message: "${message}"`,
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
  let message: string = "";
  let image: string | undefined;

  if (requestUrl.searchParams.get("message")) {
    message = decodeURIComponent(requestUrl.searchParams.get("message")!);
  } else {
    throw "Message is required";
  }

  if (requestUrl.searchParams.get("image")) {
    image = decodeURIComponent(requestUrl.searchParams.get("image")!);
  }

  return {
    message,
    image,
  };
}