import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { StructuredProduct } from "../src/types/structured_product";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { getPdaWithSeeds, newAccountWithLamports, PDA } from "./utils";
import { TransferSnapshotHook } from "../src/types/transfer_snapshot_hook";
import { TreasuryWallet } from "../src/types/treasury_wallet";
import { StructuredNotesSdk } from "../src";
import {
  SignerWallet,
  sleep,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";
import { expect } from "chai";

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

  let paymentMint: Keypair;

  let treasuryWallet: Keypair;
  let treasuryWalletPaymentATA: PublicKey;
  let treasuryWalletAuthorityPda: PDA;

  let sdk: StructuredNotesSdk;

  beforeEach(async () => {
    investor = provider.publicKey;
    issuer = await newAccountWithLamports(provider.connection);

    sdk = new StructuredNotesSdk(
      provider.connection,
      provider.wallet,
      structuredProductProgram,
      treasuryWalletProgram
    );
    treasuryWallet = anchor.web3.Keypair.generate();
    treasuryWalletAuthorityPda = await getPdaWithSeeds(
      [treasuryWallet.publicKey.toBuffer()],
      treasuryWalletProgram.programId
    );

    const initTreasuryWalletIx = await treasuryWalletProgram.methods
      .initialize()
      .accounts({
        owner: issuer.publicKey,
        treasuryWallet: treasuryWallet.publicKey,
        treasuryAuthority: treasuryWalletAuthorityPda.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();

    paymentMint = Keypair.generate();

    // create payment mint account using system program
    const createPaymentMintAccountIx = SystemProgram.createAccount({
      fromPubkey: provider.publicKey,
      newAccountPubkey: paymentMint.publicKey,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_2022_PROGRAM_ID,
    });

    const initPaymentMintIx = createInitializeMint2Instruction(
      paymentMint.publicKey,
      6,
      provider.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    );

    treasuryWalletPaymentATA = getAssociatedTokenAddressSync(
      paymentMint.publicKey,
      treasuryWalletAuthorityPda.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const treasuryWalletATAInitIx = createAssociatedTokenAccountInstruction(
      provider.publicKey,
      treasuryWalletPaymentATA,
      treasuryWalletAuthorityPda.publicKey,
      paymentMint.publicKey,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintToTreasuryWalletIx = createMintToCheckedInstruction(
      paymentMint.publicKey,
      treasuryWalletPaymentATA,
      provider.publicKey,
      1000000000000,
      6,
      [],
      TOKEN_2022_PROGRAM_ID
    );

    const tx = new Transaction()
      .add(initTreasuryWalletIx)
      .add(createPaymentMintAccountIx)
      .add(initPaymentMintIx)
      .add(treasuryWalletATAInitIx)
      .add(mintToTreasuryWalletIx);

    await provider.sendAndConfirm(tx, [issuer, treasuryWallet, paymentMint]);
  });

  it("structured product happy flow!", async () => {
    const issuerSdk = new StructuredNotesSdk(
      provider.connection,
      new SignerWallet(issuer),
      structuredProductProgram,
      treasuryWalletProgram
    );

    console.log("Investor: ", sdk.provider.walletKey.toBase58());
    console.log("Issuer: ", issuerSdk.provider.walletKey.toBase58());

    const paymentDate = new BN(Date.now()).divn(1000).addn(1);
    const { signedTx, mint } = await issuerSdk.signIssuanceOffline({
      investor: investor,
      issuer: issuer.publicKey,
      issuerTreasuryWallet: treasuryWallet.publicKey,
      paymentDate: paymentDate,
      paymentMint: paymentMint.publicKey,
      supply: new BN(1000),
      priceAuthority: provider.publicKey,
    });

    await sdk.signAndBroadcastIssueTransaction(signedTx);

    const investorATA = getAssociatedTokenAddressSync(
      mint,
      investor,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const investorTokenAccount = await getAccount(
      provider.connection,
      investorATA,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    expect(investorTokenAccount.amount).to.equal(1000n);

    await sleep(2000);

    console.log("Mint: ", mint.toBase58());

    const setPaymentIx = await sdk.createSetPaymentPriceInstruction(
      { mint: mint },
      new BN(100),
      paymentDate
    );

    const pullPaymentIx = await sdk.createPullPaymentInstruction(
      {
        paymentMint: paymentMint.publicKey,
        structuredProductMint: mint,
        treasuryWallet: treasuryWallet.publicKey,
      },
      paymentDate
    );

    const pullPaymentTx = new TransactionEnvelope(sdk.provider, [
      setPaymentIx,
      pullPaymentIx,
    ]);

    const simulationResult = await pullPaymentTx.simulate();

    console.log("Simulation result: ", simulationResult);
    console.log("Simulation error: ", simulationResult.value.err);

    const pendingTx = await pullPaymentTx.send();

    await pendingTx.wait();

    const paymentTokenAccount = await sdk.getPaymentTokenAccount(
      mint,
      paymentMint.publicKey,
      paymentDate
    );

    expect(paymentTokenAccount.amount).to.equal(100000n);
  });
});
