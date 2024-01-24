import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StructuredProduct } from "../target/types/structured_product";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getOrCreateAssociatedTokenAccount,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getPdaWithSeeds, newAccountWithLamports, PDA } from "./utils";
import { TransferSnapshotHook } from "../target/types/transfer_snapshot_hook";
import { TreasuryWallet } from "../target/types/treasury_wallet";
import BN, { min } from "bn.js";

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
  let issuerATA: PublicKey;
  let investor: Signer;
  let investorATA: PublicKey;
  let mint: Keypair;
  let structuredProduct: PDA;
  let programATA: PublicKey;

  let treasuryWallet: Keypair;
  let treasuryWalletAuthorityPda: PDA;

  beforeEach(async () => {
    issuer = await newAccountWithLamports(provider.connection);
    investor = await newAccountWithLamports(provider.connection);
    mint = anchor.web3.Keypair.generate();
    treasuryWallet = anchor.web3.Keypair.generate();

    issuerATA = getAssociatedTokenAddressSync(
      mint.publicKey,
      issuer.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    investorATA = getAssociatedTokenAddressSync(
      mint.publicKey,
      investor.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    structuredProduct = await getPdaWithSeeds(
      [mint.publicKey.toBuffer()],
      structuredProductProgram.programId
    );

    programATA = getAssociatedTokenAddressSync(
      mint.publicKey,
      structuredProduct.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    treasuryWalletAuthorityPda = await getPdaWithSeeds(
      [treasuryWallet.publicKey.toBuffer()],
      treasuryWalletProgram.programId
    );

    const tx = new Transaction().add(
      await treasuryWalletProgram.methods
        .initialize()
        .accounts({
          owner: issuer.publicKey,
          treasuryWallet: treasuryWallet.publicKey,
          treasuryAuthority: treasuryWalletAuthorityPda.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction()
    );

    await sendAndConfirmTransaction(provider.connection, tx, [
      issuer,
      treasuryWallet,
    ]);
  });

  it("should create a structured product", async () => {
    const structuredProductPDA = await getPdaWithSeeds(
      [mint.publicKey.toBuffer()],
      structuredProductProgram.programId
    );

    const lamports = await getMinimumBalanceForRentExemptMint(
      provider.connection
    );

    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: investor.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMint2Instruction(
        mint.publicKey,
        0,
        structuredProductPDA.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        investor.publicKey,
        investorATA,
        investor.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        investor.publicKey,
        programATA,
        structuredProductPDA.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      await structuredProductProgram.methods
        .initialize(new BN(1000))
        .accounts({
          structuredProduct: structuredProductPDA.publicKey,
          issuer: issuer.publicKey,
          investor: investor.publicKey,
          mint: mint.publicKey,
          issuerTreasuryWallet: treasuryWallet.publicKey,
          investorTokenAccount: investorATA,
          programTokenAccount: programATA,
          // treasuryWalletProgram: treasuryWalletProgram.programId,
          // snapshotTransferHookProgram: transferSnapshotHookProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction()
    );

    await sendAndConfirmTransaction(provider.connection, tx, [investor, mint]);
  });
});
