import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { StructuredProduct } from "../target/types/structured_product";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { getPdaWithSeeds, newAccountWithLamports, PDA } from "./utils";
import { TransferSnapshotHook } from "../target/types/transfer_snapshot_hook";
import { TreasuryWallet } from "../target/types/treasury_wallet";
import { StructuredNotesSdk } from "../src";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { SignerWallet } from "@saberhq/solana-contrib";

describe("structured-product", () => {
  const structuredProductProgram = anchor.workspace
    .StructuredProduct as Program<StructuredProduct>;

  const transferSnapshotHookProgram = anchor.workspace
    .TransferSnapshotHook as Program<TransferSnapshotHook>;

  const treasuryWalletProgram = anchor.workspace
    .TreasuryWallet as Program<TreasuryWallet>;

  anchor.setProvider(anchor.AnchorProvider.env());

  const provider: AnchorProvider = anchor.getProvider() as AnchorProvider;

  let issuer: Keypair;
  let issuerATA: PublicKey;
  let investor: PublicKey;
  let investorATA: PublicKey;
  let mint: Keypair;
  let structuredProduct: PDA;
  let programATA: PublicKey;

  let treasuryWallet: Keypair;
  let treasuryWalletAuthorityPda: PDA;

  let sdk: StructuredNotesSdk;

  beforeEach(async () => {
    investor = provider.publicKey;
    issuer = await newAccountWithLamports(provider.connection);

    sdk = new StructuredNotesSdk(
      provider.connection,
      provider.wallet,
      structuredProductProgram
    );
    mint = anchor.web3.Keypair.generate();
    treasuryWallet = anchor.web3.Keypair.generate();
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
    const issuerSdk = new StructuredNotesSdk(
      provider.connection,
      new SignerWallet(issuer),
      structuredProductProgram
    );

    console.log("Investor: ", sdk.provider.walletKey.toBase58());
    console.log("Issuer: ", issuerSdk.provider.walletKey.toBase58());

    const { nonceAccount, noncePubkey } =
      await issuerSdk.createDurableNonceAccount();

    const issuerSignedInit = await issuerSdk.signInitializeOffline(
      1000000,
      {
        investor: investor,
        issuer: issuer.publicKey,
        issuerTreasuryWallet: treasuryWallet.publicKey,
      },
      nonceAccount,
      noncePubkey
    );

    await sdk.signAndBroadcastInitialize(issuerSignedInit);
  });
});
