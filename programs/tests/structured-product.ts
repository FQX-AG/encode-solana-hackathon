import util from "node:util";
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
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import BN from "bn.js";
import { expect } from "chai";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

// prevent console.log truncating arrays
util.inspect.defaultOptions.maxArrayLength = null;

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
  let investor: PublicKey;
  let investorATA: PublicKey;
  let investorPaymentATA: PublicKey;
  let mint: Keypair;
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

    investorPaymentATA = getAssociatedTokenAddressSync(
      paymentMint.publicKey,
      investor,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const createPayerATAIx = createAssociatedTokenAccountInstruction(
      provider.publicKey,
      investorPaymentATA,
      investor,
      paymentMint.publicKey,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const createMintToInvestorWalletIx = createMintToCheckedInstruction(
      paymentMint.publicKey,
      investorPaymentATA,
      provider.publicKey,
      1000000000000,
      6,
      [],
      TOKEN_2022_PROGRAM_ID
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
      .add(createPayerATAIx)
      .add(createMintToInvestorWalletIx);
    // .add(mintToTreasuryWalletIx)

    await provider.sendAndConfirm(tx, [issuer, treasuryWallet, paymentMint]);
    mint = Keypair.generate();

    investorATA = getAssociatedTokenAddressSync(
      mint.publicKey,
      investor,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
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
      paymentMint: paymentMint.publicKey,
      issuancePricePerUnit: new BN(1000000),
      supply: new BN(1000),
    };
    /*** ----------------- BACKEND ----------------- ***/
    // Inputs assumed to be given by investor and random yield provided by backend
    const encodedInitSPTx = await issuerSdk.signStructuredProductInitOffline(
      config,
      mint
    );

    const encodedIssueSPTx = await issuerSdk.signStructuredProductIssueOffline({
      investor: investor,
      issuer: issuer.publicKey,
      issuerTreasuryWallet: treasuryWallet.publicKey,
      mint: mint.publicKey,
      paymentMint: paymentMint.publicKey,
      issuanceProceedsBeneficiary: treasuryWalletPaymentATA,
    });

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

    const snapshotConfigPDA = await getPdaWithSeeds(
      [Buffer.from("snapshots"), mint.publicKey.toBuffer()],
      sdk.transferSnapshotHookProgram.programId
    );

    const { snapshots, ...snapshotConfig } =
      await sdk.transferSnapshotHookProgram.account.snapshotConfig.fetch(
        snapshotConfigPDA.publicKey
      );

    console.log("Snapshot config: ", snapshotConfig);
    console.log(
      "Snapshots: ",
      snapshots.map((s) => s.toString())
    );
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
      investorTokenSnapshotBalancesAccount.snapshotBalances.map((b) =>
        !b ? b : b.toString()
      )
    );

    expect(investorTokenSnapshotBalancesAccount.snapshotBalances[0].eqn(1000));

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

    const settlePaymentTx = await sdk.createV0Tx([
      await sdk.createSettlePaymentInstruction(
        {
          structuredProductMint: mint.publicKey,
          beneficiaryPaymentTokenAccount: investorPaymentATA,
          beneficiaryTokenAccount: investorATA,
          paymentMint: paymentMint.publicKey,
          beneficiary: investor,
        },
        true,
        config.payments[2].paymentDateOffsetSeconds
      ),
    ]);

    const simulationResult2 = await provider.connection.simulateTransaction(
      settlePaymentTx
    );

    console.log("Simulation result: ", simulationResult2);

    const investorTokenAccountInfo2 = await provider.connection.getAccountInfo(
      investorPaymentATA
    );

    const investorTokenAccount2 = unpackAccount(
      investorPaymentATA,
      investorTokenAccountInfo2,
      TOKEN_2022_PROGRAM_ID
    );

    await provider.sendAndConfirm(settlePaymentTx);

    const investorTokenAccountInfo3 = await provider.connection.getAccountInfo(
      investorPaymentATA
    );

    const investorTokenAccount3 = unpackAccount(
      investorATA,
      investorTokenAccountInfo3,
      TOKEN_2022_PROGRAM_ID
    );

    expect(investorTokenAccount3.amount).to.equal(
      investorTokenAccount2.amount + 100000n
    );
  });
});
