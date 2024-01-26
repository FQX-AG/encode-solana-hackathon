import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  NONCE_ACCOUNT_LENGTH,
  NonceAccount,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { StructuredProduct } from "./types/structured_product";
import BN from "bn.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { getPdaWithSeeds } from "./utils";
import {
  SingleConnectionBroadcaster,
  SolanaAugmentedProvider,
  SolanaProvider,
  TransactionEnvelope,
  Wallet,
} from "@saberhq/solana-contrib";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { TreasuryWallet } from "./types/treasury_wallet";

export type InitializeInstructionAccounts = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
};

export type IssueInstructionAccounts = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
  mint: PublicKey;
};

export type AddVariablePaymentInstructionAccounts = {
  paymentMint: PublicKey;
  paymentRedemptionMint: PublicKey;
  structuredProductMint: PublicKey;
  priceAuthority: PublicKey;
};

export type SetPaymentPriceInstructionAccounts = {
  mint: PublicKey;
};

export type CreatePullPaymentInstructionAccounts = {
  structuredProductMint: PublicKey;
  treasuryWallet: PublicKey;
  paymentMint: PublicKey;
};

export type SignIssuanceOfflineConfig = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
  paymentMint: PublicKey;
  // paymentRedemptionMint: PublicKey; we just take the SP mint
  priceAuthority: PublicKey;
  supply: BN;
  paymentDate: BN;
};

export class StructuredNotesSdk {
  readonly provider: SolanaAugmentedProvider;

  constructor(
    connection: Connection,
    wallet: Wallet,
    readonly program: Program<StructuredProduct>,
    readonly treasuryWalletProgram: Program<TreasuryWallet>
  ) {
    this.provider = new SolanaAugmentedProvider(
      new SolanaProvider(
        connection,
        new SingleConnectionBroadcaster(connection),
        wallet
      )
    );
  }

  async createDurableNonceAccount() {
    const nonceKeypair = Keypair.generate();
    const tx = new TransactionEnvelope(this.provider, [
      // create system account with the minimum amount needed for rent exemption.
      // NONCE_ACCOUNT_LENGTH is the space a nonce account takes
      SystemProgram.createAccount({
        fromPubkey: this.provider.walletKey,
        newAccountPubkey: nonceKeypair.publicKey,
        lamports: 0.0015 * LAMPORTS_PER_SOL,
        space: NONCE_ACCOUNT_LENGTH,
        programId: SystemProgram.programId,
      }),
      // initialise nonce with the created nonceKeypair's pubkey as the noncePubkey
      // also specify the authority of the nonce account
      SystemProgram.nonceInitialize({
        noncePubkey: nonceKeypair.publicKey,
        authorizedPubkey: this.provider.walletKey,
      }),
    ]);

    tx.addSigners(nonceKeypair);

    await tx.confirm();

    const accountInfo = await this.provider.connection.getAccountInfo(
      nonceKeypair.publicKey
    );
    return {
      nonceAccount: NonceAccount.fromAccountData(accountInfo.data),
      noncePubkey: nonceKeypair.publicKey,
    };
  }

  async getInitializeInstruction(
    accounts: InitializeInstructionAccounts,
    mint: Keypair
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [mint.publicKey.toBuffer()],
      this.program.programId
    );

    return await this.program.methods
      .initialize()
      .accounts({
        ...accounts,
        authority: this.provider.walletKey,
        mint: mint.publicKey,
        structuredProduct: structuredProductPDA.publicKey,
        issuerTreasuryWallet: accounts.issuerTreasuryWallet,
        treasuryWalletProgram: this.treasuryWalletProgram.programId,
        // snapshotTransferHookProgram: transferSnapshotHookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([mint])
      .instruction();
  }

  async getAddVariablePaymentInstruction(
    accounts: AddVariablePaymentInstructionAccounts,
    paymentTimestamp: BN
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [accounts.structuredProductMint.toBuffer()],
      this.program.programId
    );

    const paymentDateBuffer = new ArrayBuffer(8);
    const view = new DataView(paymentDateBuffer);
    view.setBigInt64(0, BigInt(paymentTimestamp.toNumber()), true);

    const paymentPDA = getPdaWithSeeds(
      [
        structuredProductPDA.publicKey.toBuffer(),
        Buffer.from(paymentDateBuffer),
      ],
      this.program.programId
    );

    console.log("paymentPDA", paymentPDA.publicKey.toBase58());

    return await this.program.methods
      .addVariablePayment(paymentTimestamp)
      .accounts({
        authority: this.provider.walletKey,
        structuredProduct: structuredProductPDA.publicKey,
        payment: paymentPDA.publicKey,
        paymentMint: accounts.paymentMint,
        paymentRedemptionMint: accounts.paymentRedemptionMint,
        priceAuthority: accounts.priceAuthority,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async getIssueInstruction(accounts: IssueInstructionAccounts, supply: BN) {
    const structuredProductPDA = getPdaWithSeeds(
      [accounts.mint.toBuffer()],
      this.program.programId
    );

    const investorATA = getAssociatedTokenAddressSync(
      accounts.mint,
      accounts.investor,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const programATA = getAssociatedTokenAddressSync(
      accounts.mint,
      structuredProductPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return await this.program.methods
      .issue(supply)
      .accounts({
        mint: accounts.mint,
        issuer: accounts.issuer,
        investor: accounts.investor,
        structuredProduct: structuredProductPDA.publicKey,
        programTokenAccount: programATA,
        investorTokenAccount: investorATA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async createSetPaymentPriceInstruction(
    accounts: SetPaymentPriceInstructionAccounts,
    price: BN,
    paymentTimestamp: BN
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [accounts.mint.toBuffer()],
      this.program.programId
    );

    const paymentDateBuffer = new ArrayBuffer(8);
    const view = new DataView(paymentDateBuffer);
    view.setBigInt64(0, BigInt(paymentTimestamp.toNumber()), true);

    const paymentPDA = getPdaWithSeeds(
      [
        structuredProductPDA.publicKey.toBuffer(),
        Buffer.from(paymentDateBuffer),
      ],
      this.program.programId
    );

    console.log("paymentPDA", paymentPDA.publicKey.toBase58());

    return await this.program.methods
      .setPaymentPrice(new BN(paymentTimestamp), price)
      .accounts({
        authority: this.provider.walletKey,
        structuredProduct: structuredProductPDA.publicKey,
        payment: paymentPDA.publicKey,
      })
      .instruction();
  }

  async createPullPaymentInstruction(
    pullPaymentAccounts: CreatePullPaymentInstructionAccounts,
    paymentTimestamp: BN
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [pullPaymentAccounts.structuredProductMint.toBuffer()],
      this.program.programId
    );

    const paymentDateBuffer = new ArrayBuffer(8);
    const view = new DataView(paymentDateBuffer);
    view.setBigInt64(0, BigInt(paymentTimestamp.toNumber()), true);

    const paymentPDA = getPdaWithSeeds(
      [
        structuredProductPDA.publicKey.toBuffer(),
        Buffer.from(paymentDateBuffer),
      ],
      this.program.programId
    );

    const withdrawAuthorizationPDA = getPdaWithSeeds(
      [
        pullPaymentAccounts.treasuryWallet.toBuffer(),
        structuredProductPDA.publicKey.toBuffer(),
      ],
      this.treasuryWalletProgram.programId
    );

    const treasuryAuthority = getPdaWithSeeds(
      [pullPaymentAccounts.treasuryWallet.toBuffer()],
      this.treasuryWalletProgram.programId
    );

    return await this.program.methods
      .pullPayment(new BN(paymentTimestamp))
      .accounts({
        payer: this.provider.walletKey,
        withdrawalAuthorization: withdrawAuthorizationPDA.publicKey,
        treasuryWallet: pullPaymentAccounts.treasuryWallet,
        treasuryAuthority: treasuryAuthority.publicKey,
        treasuryWalletTokenAccount: getAssociatedTokenAddressSync(
          pullPaymentAccounts.paymentMint,
          treasuryAuthority.publicKey,
          true,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        mint: pullPaymentAccounts.structuredProductMint,
        structuredProduct: structuredProductPDA.publicKey,
        paymentMint: pullPaymentAccounts.paymentMint,
        payment: paymentPDA.publicKey,
        paymentTokenAccount: getAssociatedTokenAddressSync(
          pullPaymentAccounts.paymentMint,
          paymentPDA.publicKey,
          true,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        treasuryWalletProgram: this.treasuryWalletProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async signIssuanceOffline(config: SignIssuanceOfflineConfig) {
    const { nonceAccount, noncePubkey } =
      await this.createDurableNonceAccount();
    const advanceIx = SystemProgram.nonceAdvance({
      noncePubkey,
      authorizedPubkey: this.provider.walletKey,
    });

    const mint = Keypair.generate();
    console.log("Mint: ", mint.publicKey.toBase58());

    const structuredProductPDA = getPdaWithSeeds(
      [mint.publicKey.toBuffer()],
      this.program.programId
    );

    const withdrawAuthorizationPDA = getPdaWithSeeds(
      [
        config.issuerTreasuryWallet.toBuffer(),
        structuredProductPDA.publicKey.toBuffer(),
      ],
      this.treasuryWalletProgram.programId
    );

    const initIx = await this.getInitializeInstruction(
      {
        investor: config.investor,
        issuer: config.issuer,
        issuerTreasuryWallet: config.issuerTreasuryWallet,
      },
      mint
    );

    const addVariablePaymentIx = await this.getAddVariablePaymentInstruction(
      {
        paymentMint: config.paymentMint,
        paymentRedemptionMint: mint.publicKey, // create a new mint for each payment
        structuredProductMint: mint.publicKey,
        priceAuthority: config.priceAuthority,
      },
      config.paymentDate
    );

    const issueIx = await this.getIssueInstruction(
      {
        investor: config.investor,
        issuer: config.issuer,
        issuerTreasuryWallet: config.issuerTreasuryWallet,
        mint: mint.publicKey,
      },
      config.supply
    );

    const addAuthorizationIx = await this.treasuryWalletProgram.methods
      .addWithdrawAuthorization()
      .accounts({
        owner: config.issuer,
        treasuryWallet: config.issuerTreasuryWallet,
        authority: structuredProductPDA.publicKey,
        withdrawAuthorization: withdrawAuthorizationPDA.publicKey,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const tx = new Transaction();
    tx.recentBlockhash = nonceAccount.nonce;
    tx.feePayer = config.investor;

    tx.add(advanceIx)
      .add(initIx)
      .add(addVariablePaymentIx)
      .add(addAuthorizationIx)
      .add(issueIx)
      .partialSign(mint);

    console.log(
      "MINT Signers",
      tx.signatures.map((s) => ({
        buffer: !!s.signature,
        publicKey: s.publicKey.toBase58(),
      }))
    );

    const signedTx = await this.provider.wallet.signTransaction(tx);

    console.log(
      "OFFLINE Signers",
      signedTx.signatures.map((s) => ({
        buffer: !!s.signature,
        publicKey: s.publicKey.toBase58(),
      }))
    );
    return {
      signedTx: bs58.encode(
        signedTx.serialize({ requireAllSignatures: false })
      ),
      mint: mint.publicKey,
    };
  }
  async signAndBroadcastIssueTransaction(issueTransaction: string) {
    const tx = Transaction.from(bs58.decode(issueTransaction));
    const finalTx = await this.provider.wallet.signTransaction(tx);

    console.log(
      "Signers",
      tx.signatures.map((s) => ({
        buffer: !!s.signature,
        publicKey: s.publicKey.toBase58(),
      }))
    );

    const txEnv = new TransactionEnvelope(this.provider, [
      ...finalTx.instructions,
    ]);

    const simulation = await txEnv.simulate();
    console.log("Simulation: ", simulation);
    console.log(simulation.value.err);
    const pendingTx = await this.provider.broadcaster.broadcast(finalTx);
    await pendingTx.wait();
  }

  async getPaymentTokenAccount(
    mint: PublicKey,
    paymentMint: PublicKey,
    timestamp: BN
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [mint.toBuffer()],
      this.program.programId
    );

    const paymentDateBuffer = new ArrayBuffer(8);
    const view = new DataView(paymentDateBuffer);
    view.setBigInt64(0, BigInt(timestamp.toNumber()), true);

    const paymentPDA = getPdaWithSeeds(
      [
        structuredProductPDA.publicKey.toBuffer(),
        Buffer.from(paymentDateBuffer),
      ],
      this.program.programId
    );

    const paymentTokenAccountAddress = getAssociatedTokenAddressSync(
      paymentMint,
      paymentPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return getAccount(
      this.provider.connection,
      paymentTokenAccountAddress,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
  }
}
