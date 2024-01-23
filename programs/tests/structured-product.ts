import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StructuredProduct } from "../target/types/structured_product";
import { Keypair, Signer } from "@solana/web3.js";
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { getPdaWithSeeds, newAccountWithLamports } from "./utils";
import { TransferSnapshotHook } from "../target/types/transfer_snapshot_hook";
import { TreasuryWallet } from "../target/types/treasury_wallet";

describe("structured-product", () => {
  const structuredProductProgram = anchor.workspace
    .StructuredProduct as Program<StructuredProduct>;

  const transferSnapshotHookProgram = anchor.workspace
    .TransferSnapshotHook as Program<TransferSnapshotHook>;

  const treasuryWalletProgram = anchor.workspace
    .TreasuryWallet as Program<TreasuryWallet>;

  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();

  let issuer: Signer;
  let issuerATA: Account;
  let investor: Signer;
  let investorATA: Account;
  let mint: Keypair;

  beforeEach(async () => {
    issuer = await newAccountWithLamports(provider.connection);
    investor = await newAccountWithLamports(provider.connection);

    mint = anchor.web3.Keypair.generate();
  });

  it("should create a structured product", async () => {
    const structuredProductPDA = await getPdaWithSeeds(
      [mint.publicKey.toBuffer()],
      structuredProductProgram.programId
    );

    const structuredProductSigningAuthorityPDA = await getPdaWithSeeds(
      [structuredProductPDA.publicKey.toBuffer()],
      structuredProductProgram.programId
    );
  });
});
