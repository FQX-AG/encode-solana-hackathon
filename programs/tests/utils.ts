import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export type PDA = {
  publicKey: PublicKey;
  bump: number;
};

export async function getPdaWithSeeds(
  seeds: Buffer[],
  programId: PublicKey
): Promise<PDA> {
  const [publicKey, bump] = PublicKey.findProgramAddressSync(seeds, programId);

  return {
    publicKey,
    bump,
  };
}

export async function newAccountWithLamports(
  connection: Connection,
  lamports = 100000000000
): Promise<Keypair> {
  const account = anchor.web3.Keypair.generate();
  const signature = await connection.requestAirdrop(
    account.publicKey,
    lamports
  );
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash({ commitment: "confirmed" });
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
  return account;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
