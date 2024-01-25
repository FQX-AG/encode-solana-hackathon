import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { StructuredProduct } from "./types/structured_product";
import BN from "bn.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { getPdaWithSeeds } from "./utils";

export type InitializeAccounts = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
};

export class StructuredNotesSdk {
  readonly provider: AnchorProvider;
  constructor(
    provider: AnchorProvider,
    public readonly program: Program<StructuredProduct>
  ) {
    this.provider = provider;
  }

  async initialize(supply: number, accounts: InitializeAccounts) {
    const mint = Keypair.generate();
    console.log("mint", mint.publicKey.toBase58());
    console.log("investor", accounts.investor.toBase58());

    const structuredProductPDA = getPdaWithSeeds(
      [mint.publicKey.toBuffer()],
      this.program.programId
    );

    const investorATA = getAssociatedTokenAddressSync(
      mint.publicKey,
      accounts.investor,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const programATA = getAssociatedTokenAddressSync(
      mint.publicKey,
      structuredProductPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const initIx = await this.program.methods
      .initialize(new BN(supply))
      .accounts({
        ...accounts,
        mint: mint.publicKey,
        structuredProduct: structuredProductPDA.publicKey,
        investorTokenAccount: investorATA,
        programTokenAccount: programATA,
        // treasuryWalletProgram: treasuryWalletProgram.programId,
        // snapshotTransferHookProgram: transferSnapshotHookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([mint])
      .instruction();

    const recentBlockhash = (
      await this.provider.connection.getLatestBlockhash()
    ).blockhash;

    const tx = new Transaction().add(initIx);

    tx.recentBlockhash = recentBlockhash;
    tx.feePayer = accounts.issuer;
    tx.partialSign(mint);

    console.log(
      "signers",
      tx.signatures.map((s) => s.publicKey.toBase58())
    );

    return tx;
  }
}
