import {Connection, PublicKey, Signer} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export type PDA = {
    publicKey: PublicKey;
    bump: number;
};
export async function newAccountWithLamports(
    connection: Connection,
    lamports = 100000000000
): Promise<Signer> {
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