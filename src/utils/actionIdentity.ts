import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { ActionPostResponse } from '../types/action';

const ACTIONS_IDENTITY_SCHEMA = {
  separator: ":",
  protocol: "solana-action",
  scheme: {
    protocol: 0,
    identity: 1,
    reference: 2,
    signature: 3,
  },
};

export function getActionIdentityFromEnv(envKey = "ACTION_IDENTITY_SECRET"): Keypair {
  try {
    if (!process.env[envKey]) throw new Error("missing env key");
    return Keypair.fromSecretKey(
      Buffer.from(JSON.parse(process.env[envKey] as string))
    );
  } catch (err) {
    throw new Error(`invalid identity in env variable: '${envKey}'`);
  }
}

export function createActionIdentifierMemo(
  identity: Keypair,
  reference: PublicKey,
): string {
  const signature = nacl.sign.detached(reference.toBuffer(), identity.secretKey);

  const identifier = new Array(
    Object.keys(ACTIONS_IDENTITY_SCHEMA.scheme).length,
  );
  identifier[ACTIONS_IDENTITY_SCHEMA.scheme.protocol] =
    ACTIONS_IDENTITY_SCHEMA.protocol;
  identifier[ACTIONS_IDENTITY_SCHEMA.scheme.identity] =
    identity.publicKey.toBase58();
  identifier[ACTIONS_IDENTITY_SCHEMA.scheme.reference] = reference.toBase58();
  identifier[ACTIONS_IDENTITY_SCHEMA.scheme.signature] = bs58.encode(signature);

  return identifier.join(ACTIONS_IDENTITY_SCHEMA.separator);
}

interface CreatePostResponseArgs {
  fields: Omit<ActionPostResponse, "transaction"> & {
    transaction: Transaction;
  };
  actionIdentity?: Keypair;
}

export async function createPostResponse({
  fields,
  actionIdentity,
}: CreatePostResponseArgs): Promise<ActionPostResponse> {
  const { transaction } = fields;

  if (!transaction.recentBlockhash)
    transaction.recentBlockhash = "11111111111111111111111111111111";

  if (!actionIdentity) {
    try {
      actionIdentity = getActionIdentityFromEnv();
    } catch (err) {
      // do nothing
    }
  }

  if (actionIdentity) {
    const reference = new Keypair().publicKey;
    const memo = createActionIdentifierMemo(actionIdentity, reference);
    
    transaction.add({
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(memo, "utf-8"),
    });

    const nonMemoInstructionIndex = transaction.instructions.findIndex(
      (ix) => ix.programId.toBase58() !== "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
    );

    if (nonMemoInstructionIndex !== -1) {
      transaction.instructions[nonMemoInstructionIndex].keys.push({
        pubkey: actionIdentity.publicKey,
        isWritable: false,
        isSigner: false,
      });
      transaction.instructions[nonMemoInstructionIndex].keys.push({
        pubkey: reference,
        isWritable: false,
        isSigner: false,
      });
    }
  }

  return {
    ...fields,
    transaction: Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64'),
  };
}