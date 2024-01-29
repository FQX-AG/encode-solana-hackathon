import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { StructuredProduct } from "../src/types/structured_product";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { getPdaWithSeeds, newAccountWithLamports, PDA, sleep } from "./utils";
import { TransferSnapshotHook } from "../src/types/transfer_snapshot_hook";
import { TreasuryWallet } from "../src/types/treasury_wallet";
import { StructuredNotesSdk } from "../src";
import {
  AccountState,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import BN from "bn.js";
import { expect } from "chai";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Account } from "@solana/spl-token/src/state/account";

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
      provider,
      structuredProductProgram,
      treasuryWalletProgram,
      transferSnapshotHookProgram
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
      new AnchorProvider(provider.connection, new NodeWallet(issuer), {
        commitment: "confirmed",
      }),
      structuredProductProgram,
      treasuryWalletProgram,
      transferSnapshotHookProgram
    );

    console.log("Investor: ", sdk.provider.publicKey.toBase58());
    console.log("Issuer: ", issuerSdk.provider.publicKey.toBase58());

    const paymentDate = new BN(Date.now()).divn(1000).addn(1);
    const mint = Keypair.generate();
    const config = {
      investor: investor,
      issuer: issuer.publicKey,
      issuerTreasuryWallet: treasuryWallet.publicKey,
      payments: [
        {
          principal: false,
          amount: new BN(1000),
          paymentDateOffsetSeconds: new BN(1),
          paymentMint: paymentMint.publicKey,
        },
        {
          principal: false,
          amount: new BN(1000),
          paymentDateOffsetSeconds: new BN(2),
          paymentMint: paymentMint.publicKey,
        },
        {
          principal: true,
          paymentDateOffsetSeconds: new BN(2),
          paymentMint: paymentMint.publicKey,
          priceAuthority: provider.publicKey, // TODO change to price setting contract
        },
      ],
    };
    /*** ----------------- BACKEND ----------------- ***/
    // Inputs assumed to be given by investor and random yield provided by backend
    const encodedInitSPTx = await issuerSdk.signStructuredProductInitOffline(
      config,
      mint
    );

    const encodedIssueSPTx = await issuerSdk.signStructuredProductIssueOffline(
      {
        investor: investor,
        issuer: issuer.publicKey,
        issuerTreasuryWallet: treasuryWallet.publicKey,
        mint: mint.publicKey,
      },
      new BN(1000)
    );

    /*** ----------------- FRONTEND ----------------- ***/
    const [issuerSignedInitSPtx, issuerSignedIssueSPTx] = [
      sdk.decodeV0Tx(encodedInitSPTx),
      sdk.decodeV0Tx(encodedIssueSPTx),
    ];

    /*** ----------------- User confirms signing here ----------------- ***/
    const [finalInitTx, finalIssueTx] =
      await provider.wallet.signAllTransactions([
        issuerSignedInitSPtx,
        issuerSignedIssueSPTx,
      ]);

    console.log("Sending final init tx... ");
    const finalInitTxId = await provider.connection.sendTransaction(
      finalInitTx
    );

    await sdk.confirmTx(finalInitTxId);
    console.log("Confirmed!");
    console.log("Sending final issue tx...");
    console.log(
      "Simulation: ",
      await sdk.provider.connection.simulateTransaction(finalIssueTx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      })
    );
    const issueTxid = await provider.connection.sendTransaction(finalIssueTx);
    await sdk.confirmTx(issueTxid);
    console.log("Confirmed issue tx!", issueTxid);

    /***------------------ Issuance success screen ------------------***/

    const investorATA = getAssociatedTokenAddressSync(
      mint.publicKey,
      investor,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log("Getting investor token account...");

    const investorTokenAccountInfo = await provider.connection.getAccountInfo(
      investorATA
    );

    const investorTokenAccount = unpackAccount(
      investorATA,
      investorTokenAccountInfo,
      TOKEN_2022_PROGRAM_ID
    );
    console.log("Investor token account: ", investorTokenAccount);
    expect(investorTokenAccount.amount).to.equal(1000n);

    const investorTokenSnapshotBalancesPDA = await getPdaWithSeeds(
      [mint.publicKey.toBuffer(), investorATA.toBuffer()],
      sdk.transferSnapshotHookProgram.programId
    );

    const investorTokenSnapshotBalancesAccount =
      await sdk.transferSnapshotHookProgram.account.snapshotTokenAccountBalances.fetch(
        investorTokenSnapshotBalancesPDA.publicKey
      );

    console.log(
      "Investor token snapshot balances: ",
      investorTokenSnapshotBalancesAccount
    );

    // expect(investorTokenSnapshotBalancesAccount.snapshotBalances[0]).to.equal(
    //   1000n
    // );

    console.log("Sleeping for 2 seconds...");
    await sleep(2001);

    console.log("Creating set payment price instruction...");

    /*** ----------------------- BACKEND ----------------------- ***/
    const setPaymentIx = await sdk.createSetPaymentPriceInstruction(
      mint.publicKey,
      true,
      new BN(100),
      config.payments[2].paymentDateOffsetSeconds
    );

    console.log("Creating pull payment instruction...");
    const pullPaymentIx = await sdk.createPullPaymentInstruction(
      {
        paymentMint: paymentMint.publicKey,
        structuredProductMint: mint.publicKey,
        treasuryWallet: treasuryWallet.publicKey,
      },
      true,
      config.payments[2].paymentDateOffsetSeconds
    );

    console.log("Creating pull payment tx...");
    const pullPaymentTx = await sdk.createV0Tx([setPaymentIx, pullPaymentIx]);

    const simulationResult = await provider.connection.simulateTransaction(
      pullPaymentTx
    );

    console.log("Simulation result: ", simulationResult);

    await provider.sendAndConfirm(pullPaymentTx);

    const paymentTokenAccount = await sdk.getPaymentTokenAccount(
      mint.publicKey,
      paymentMint.publicKey,
      true,
      config.payments[2].paymentDateOffsetSeconds
    );

    expect(paymentTokenAccount.amount).to.equal(100000n);
  });
});
