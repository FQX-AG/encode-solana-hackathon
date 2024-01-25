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
import {
  SingleConnectionBroadcaster,
  SolanaProvider,
  TransactionEnvelope,
  Wallet,
} from "@saberhq/solana-contrib";

export type InitializeAccounts = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
};

export class StructuredNotesSdk {
  readonly provider: SolanaProvider;
  constructor(
    provider: AnchorProvider,
    wallet: Wallet,
    public readonly program: Program<StructuredProduct>
  ) {
    this.provider = new SolanaProvider(
      provider.connection,
      new SingleConnectionBroadcaster(provider.connection),
      provider.wallet
    );
  }

  async initialize(supply: number, accounts: InitializeAccounts) {
    const mint = Keypair.generate();

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

    const tx = new TransactionEnvelope(this.provider, [initIx]);
    tx.addSigners(mint);

    return tx;
  }
}
