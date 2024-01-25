import { PublicKey } from "@solana/web3.js";

export type PDA = {
  publicKey: PublicKey;
  bump: number;
};

export function getPdaWithSeeds(seeds: Buffer[], programId: PublicKey): PDA {
  const [publicKey, bump] = PublicKey.findProgramAddressSync(seeds, programId);

  return {
    publicKey,
    bump,
  };
}
