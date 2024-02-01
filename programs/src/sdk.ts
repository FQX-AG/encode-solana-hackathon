import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  AddressLookupTableProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  NONCE_ACCOUNT_LENGTH,
  NonceAccount,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { StructuredProduct } from "./types/structured_product";
import BN from "bn.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import { getPdaWithSeeds } from "./utils";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { TreasuryWallet } from "./types/treasury_wallet";
import { TransferSnapshotHook } from "./types/transfer_snapshot_hook";
import {
  findMetadataPda,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

export type InitializeStructuredProductInstructionAccounts = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
  paymentMint: PublicKey;
};

export type InitializeSnapshotTransferHookInstructionAccounts = {
  snapshotConfig: PublicKey;
  mint: PublicKey;
  authority: PublicKey;
};

export type IssueInstructionAccounts = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
  mint: PublicKey;
};

export type PayIssuanceInstructionAccounts = {
  mint: PublicKey;
  paymentMint: PublicKey;
  payer: PublicKey;
};

export type AddPaymentInstructionAccount = {
  paymentMint: PublicKey;
  structuredProductMint: PublicKey;
  priceAuthority?: PublicKey;
};

export type WithdrawIssuanceProceedsInstructionAccounts = {
  mint: PublicKey;
  paymentMint: PublicKey;
  issuer: PublicKey;
  beneficiaryTokenAccount: PublicKey;
};

export type CreatePullPaymentInstructionAccounts = {
  structuredProductMint: PublicKey;
  treasuryWallet: PublicKey;
  paymentMint: PublicKey;
};

export type CreateSettlePaymentInstructionAccounts = {
  structuredProductMint: PublicKey;
  beneficiary: PublicKey;
  beneficiaryTokenAccount: PublicKey;
  beneficiaryPaymentTokenAccount: PublicKey;
  paymentMint: PublicKey;
};

export type SignStructuredProductInitOfflineConfig = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
  payments: {
    amount?: BN;
    priceAuthority?: PublicKey;
    paymentMint: PublicKey;
    principal: boolean;
    paymentDateOffsetSeconds: BN;
  }[];
  paymentMint: PublicKey;
  issuancePricePerUnit: BN;
  supply: BN;
};

export type SignStructuredProductIssueOffline = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
  mint: PublicKey;
  paymentMint: PublicKey;
  issuanceProceedsBeneficiary: PublicKey;
};

export type LookupTableMap = {
  [key: string]: PublicKey;
};

export class StructuredNotesSdk {
  constructor(
    readonly provider: AnchorProvider,
    readonly program: Program<StructuredProduct>,
    readonly treasuryWalletProgram: Program<TreasuryWallet>,
    readonly transferSnapshotHookProgram: Program<TransferSnapshotHook>
  ) {}

  async createV0Tx(
    ixs: TransactionInstruction[],
    signers?: Signer[],
    recentBlockHash?: string,
    lookupTables?: AddressLookupTableAccount[]
  ) {
    if (recentBlockHash) {
      console.log(
        "Received recentBlockHash presumably a durable nonce: ",
        recentBlockHash
      );
    }
    const recentBlockhash =
      recentBlockHash ??
      (await this.provider.connection.getLatestBlockhash("finalized"))
        .blockhash;

    const messageV0 = new TransactionMessage({
      payerKey: this.provider.publicKey,
      instructions: ixs,
      recentBlockhash,
    }).compileToV0Message(lookupTables);

    const tx = new VersionedTransaction(messageV0);

    if (signers) {
      tx.sign(signers);
    }
    return tx;
  }

  async createAndSignV0Tx(
    ixs: TransactionInstruction[],
    signers?: Signer[],
    recentBlockHash?: string,
    lookupTables?: AddressLookupTableAccount[]
  ) {
    const tx = await this.createV0Tx(
      ixs,
      signers,
      recentBlockHash,
      lookupTables
    );
    return await this.provider.wallet.signTransaction(tx);
  }

  async confirmTx(txId: string, recentBlockHash?: string) {
    const latestBlockHash = await this.provider.connection.getLatestBlockhash(
      "finalized"
    );
    const confirmation = await this.provider.connection.confirmTransaction({
      signature: txId,
      blockhash: recentBlockHash ?? latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error(
        `Failed to confirm: ${confirmation.value.err.toString()}`
      );
    }
  }

  async sendAndConfirmV0Tx(
    ixs: TransactionInstruction[],
    signers?: Signer[],
    recentBlockHash?: string,
    lookupTables?: AddressLookupTableAccount[]
  ) {
    const latestBlockHash = await this.provider.connection.getLatestBlockhash(
      "finalized"
    );

    const tx = await this.createAndSignV0Tx(
      ixs,
      signers,
      recentBlockHash ?? latestBlockHash.blockhash,
      lookupTables
    );

    const txId = await this.provider.connection.sendTransaction(tx);
    const confirmation = await this.provider.connection.confirmTransaction({
      signature: txId,
      blockhash: recentBlockHash ?? latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    });
    if (confirmation.value.err) {
      throw new Error(
        `Failed to confirm: ${confirmation.value.err.toString()}`
      );
    }

    return txId;
  }

  async getPaymentPda(mint: PublicKey, principal: boolean, timestamp: BN) {
    const structuredProductPDA = getPdaWithSeeds(
      [mint.toBuffer()],
      this.program.programId
    );

    const paymentDateBuffer = new ArrayBuffer(8);
    const view = new DataView(paymentDateBuffer);
    view.setBigInt64(0, BigInt(timestamp.toNumber()), true);

    const principalBuffer = Buffer.from([principal ? 1 : 0]);
    return getPdaWithSeeds(
      [
        structuredProductPDA.publicKey.toBuffer(),
        Buffer.from(principalBuffer),
        Buffer.from(paymentDateBuffer),
      ],
      this.program.programId
    );
  }

  // TODO remove augmented provider
  async createDurableNonceAccountInstructions(nonceKeypair: Keypair) {
    return [
      // create system account with the minimum amount needed for rent exemption.
      // NONCE_ACCOUNT_LENGTH is the space a nonce account takes
      SystemProgram.createAccount({
        fromPubkey: this.provider.publicKey,
        newAccountPubkey: nonceKeypair.publicKey,
        lamports: 0.0015 * LAMPORTS_PER_SOL,
        space: NONCE_ACCOUNT_LENGTH,
        programId: SystemProgram.programId,
      }),
      // initialise nonce with the created nonceKeypair's pubkey as the noncePubkey
      // also specify the authority of the nonce account
      SystemProgram.nonceInitialize({
        noncePubkey: nonceKeypair.publicKey,
        authorizedPubkey: this.provider.publicKey,
      }),
    ];
  }

  async createInitializeStructuredProductInstruction(
    accounts: InitializeStructuredProductInstructionAccounts,
    mint: Keypair,
    maxSnapshots: number,
    issuancePricePerUnit: BN,
    supply: BN
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [mint.publicKey.toBuffer()],
      this.program.programId
    );

    console.log(
      "ISSUER BALANCE:",
      await this.provider.connection.getBalance(accounts.issuer)
    );

    console.log(
      "INVESTOR BALANCE:",
      await this.provider.connection.getBalance(accounts.investor)
    );

    const extraAccountPDA = getPdaWithSeeds(
      [Buffer.from("extra-account-metas"), mint.publicKey.toBuffer()],
      this.transferSnapshotHookProgram.programId
    );

    const snapshotConfigPda = getPdaWithSeeds(
      [Buffer.from("snapshots"), mint.publicKey.toBuffer()],
      this.transferSnapshotHookProgram.programId
    );

    const allAccounts = {
      ...accounts,
      authority: this.provider.publicKey,
      mint: mint.publicKey,
      structuredProduct: structuredProductPDA.publicKey,
      issuerTreasuryWallet: accounts.issuerTreasuryWallet,
      treasuryWalletProgram: this.treasuryWalletProgram.programId,
      paymentMint: accounts.paymentMint,
      snapshotConfig: snapshotConfigPda.publicKey,
      extraAccount: extraAccountPDA.publicKey,
      snapshotTransferHookProgram: this.transferSnapshotHookProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
    };
    console.log({ allAccounts });
    return await this.program.methods
      .initialize(maxSnapshots, issuancePricePerUnit, supply)
      .accounts(allAccounts)
      .signers([mint])
      .instruction();
  }

  async createPayIssuanceInstruction(accounts: PayIssuanceInstructionAccounts) {
    const structuredProductPDA = getPdaWithSeeds(
      [accounts.mint.toBuffer()],
      this.program.programId
    );

    const payerATA = getAssociatedTokenAddressSync(
      accounts.paymentMint,
      accounts.payer,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const structuredProductATA = getAssociatedTokenAddressSync(
      accounts.paymentMint,
      structuredProductPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return this.program.methods
      .payIssuance()
      .accounts({
        mint: accounts.mint,
        structuredProduct: structuredProductPDA.publicKey,
        paymentMint: accounts.paymentMint,
        payer: accounts.payer,
        payerTokenAccount: payerATA,
        structuredProductTokenAccount: structuredProductATA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async createWithdrawIssuanceProceedsInstruction(
    accounts: WithdrawIssuanceProceedsInstructionAccounts
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [accounts.mint.toBuffer()],
      this.program.programId
    );

    const structuredProductATA = getAssociatedTokenAddressSync(
      accounts.paymentMint,
      structuredProductPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return this.program.methods
      .withdrawIssuanceProceeds()
      .accounts({
        mint: accounts.mint,
        structuredProduct: structuredProductPDA.publicKey,
        paymentMint: accounts.paymentMint,
        payer: this.provider.publicKey,
        issuer: accounts.issuer,
        beneficiaryTokenAccount: accounts.beneficiaryTokenAccount,
        structuredProductTokenAccount: structuredProductATA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();
  }
  async getAddPaymentInstruction(
    accounts: AddPaymentInstructionAccount,
    paymentTimestamp: BN,
    principal: boolean,
    pricePerUnit?: BN
  ) {
    if (!!accounts.priceAuthority == !!pricePerUnit) {
      throw new Error("Either priceAuthority or pricePerUnit must be set");
    }
    const structuredProductPDA = getPdaWithSeeds(
      [accounts.structuredProductMint.toBuffer()],
      this.program.programId
    );

    const paymentPDA = await this.getPaymentPda(
      accounts.structuredProductMint,
      principal,
      paymentTimestamp
    );

    console.log("paymentPDA", paymentPDA.publicKey.toBase58());

    const snapshotConfigPDA = getPdaWithSeeds(
      [Buffer.from("snapshots"), accounts.structuredProductMint.toBuffer()],
      this.transferSnapshotHookProgram.programId
    );

    const accountDetails = {
      mint: accounts.structuredProductMint,
      snapshotConfig: snapshotConfigPDA.publicKey,
      authority: this.provider.publicKey,
      structuredProduct: structuredProductPDA.publicKey,
      payment: paymentPDA.publicKey,
      paymentMint: accounts.paymentMint,
      snapshotTransferHookProgram: this.transferSnapshotHookProgram.programId,
      systemProgram: SystemProgram.programId,
    };

    if (accounts.priceAuthority) {
      return await this.program.methods
        .addVariablePayment(principal, paymentTimestamp)
        .accounts({
          ...accountDetails,
          priceAuthority: accounts.priceAuthority,
        })
        .instruction();
    }
    return await this.program.methods
      .addStaticPayment(principal, paymentTimestamp, pricePerUnit)
      .accounts(accountDetails)
      .instruction();
  }

  async getSnapshotBalancesAccountPDA(mint: PublicKey, owner: PublicKey) {
    const ownerATA = getAssociatedTokenAddressSync(
      mint,
      owner,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return getPdaWithSeeds(
      [mint.toBuffer(), ownerATA.toBuffer()],
      this.transferSnapshotHookProgram.programId
    );
  }

  async createInitSnapshotBalancesAccountInstruction({
    mint,
    owner,
  }: {
    mint: PublicKey;
    owner: PublicKey;
  }) {
    const snapshotConfigPDA = getPdaWithSeeds(
      [Buffer.from("snapshots"), mint.toBuffer()],
      this.transferSnapshotHookProgram.programId
    );

    const ownerATA = getAssociatedTokenAddressSync(
      mint,
      owner,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const snapshotBalancesPDA = await this.getSnapshotBalancesAccountPDA(
      mint,
      owner
    );

    return await this.transferSnapshotHookProgram.methods
      .initSnapshotBalancesAccount()
      .accounts({
        snapshotConfig: snapshotConfigPDA.publicKey,
        mint,
        owner,
        payer: this.provider.publicKey,
        snapshotBalances: snapshotBalancesPDA.publicKey,
        tokenAccount: ownerATA,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async createIssueInstruction(accounts: IssueInstructionAccounts) {
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

    const investorSnapshotTokenBalancesAcountPDA =
      await this.getSnapshotBalancesAccountPDA(
        accounts.mint,
        accounts.investor
      );

    const programATA = getAssociatedTokenAddressSync(
      accounts.mint,
      structuredProductPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const programSnapshotTokenBalancesAcountPDA =
      await this.getSnapshotBalancesAccountPDA(
        accounts.mint,
        structuredProductPDA.publicKey
      );

    const snapshotConfigPDA = getPdaWithSeeds(
      [Buffer.from("snapshots"), accounts.mint.toBuffer()],
      this.transferSnapshotHookProgram.programId
    );

    const extraAccountMetasPDA = getPdaWithSeeds(
      [Buffer.from("extra-account-metas"), accounts.mint.toBuffer()],
      this.transferSnapshotHookProgram.programId
    );

    return await this.program.methods
      .issue()
      .accounts({
        mint: accounts.mint,
        issuer: accounts.issuer,
        investor: accounts.investor,
        structuredProduct: structuredProductPDA.publicKey,
        snapshotConfig: snapshotConfigPDA.publicKey,
        investorTokenAccount: investorATA,
        investorTokenSnapshotBalancesAccount:
          investorSnapshotTokenBalancesAcountPDA.publicKey,
        programTokenAccount: programATA,
        programTokenSnapshotBalancesAccount:
          programSnapshotTokenBalancesAcountPDA.publicKey,
        extraAccountMetaList: extraAccountMetasPDA.publicKey,
        snapshotTransferHookProgram: this.transferSnapshotHookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async createSetPaymentPriceInstruction(
    mint: PublicKey,
    principal: boolean,
    price: BN,
    paymentDateOffsetSeconds: BN
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [mint.toBuffer()],
      this.program.programId
    );

    const paymentPDA = await this.getPaymentPda(
      mint,
      principal,
      paymentDateOffsetSeconds
    );

    console.log("paymentPDA", paymentPDA.publicKey.toBase58());

    return await this.program.methods
      .setPaymentPrice(new BN(paymentDateOffsetSeconds), price)
      .accounts({
        authority: this.provider.publicKey,
        structuredProduct: structuredProductPDA.publicKey,
        payment: paymentPDA.publicKey,
      })
      .instruction();
  }

  async createPullPaymentInstruction(
    pullPaymentAccounts: CreatePullPaymentInstructionAccounts,
    principal: boolean,
    paymentTimestamp: BN
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [pullPaymentAccounts.structuredProductMint.toBuffer()],
      this.program.programId
    );

    const paymentPDA = await this.getPaymentPda(
      pullPaymentAccounts.structuredProductMint,
      principal,
      paymentTimestamp
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
        payer: this.provider.publicKey,
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

  async createSettlePaymentInstruction(
    accounts: CreateSettlePaymentInstructionAccounts,
    principal: boolean,
    paymentTimestamp: BN
  ) {
    const structuredProductPDA = getPdaWithSeeds(
      [accounts.structuredProductMint.toBuffer()],
      this.program.programId
    );

    const paymentPDA = await this.getPaymentPda(
      accounts.structuredProductMint,
      principal,
      paymentTimestamp
    );

    const paymentTokenAccount = getAssociatedTokenAddressSync(
      accounts.paymentMint,
      paymentPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const paymentPaidPDA = getPdaWithSeeds(
      [
        paymentPDA.publicKey.toBuffer(),
        accounts.beneficiaryTokenAccount.toBuffer(),
      ],
      this.program.programId
    );

    const snapshotBalancesAccount = getPdaWithSeeds(
      [
        accounts.structuredProductMint.toBuffer(),
        accounts.beneficiaryTokenAccount.toBuffer(),
      ],
      this.transferSnapshotHookProgram.programId
    );

    const snapshotConfigPDA = getPdaWithSeeds(
      [Buffer.from("snapshots"), accounts.structuredProductMint.toBuffer()],
      this.transferSnapshotHookProgram.programId
    );

    return await this.program.methods
      .settlePayment(new BN(paymentTimestamp))
      .accounts({
        payer: this.provider.publicKey,
        beneficiary: accounts.beneficiary,
        beneficiaryTokenAccount: accounts.beneficiaryTokenAccount,
        beneficiarySnapshotBalancesAccount: snapshotBalancesAccount.publicKey,
        beneficiaryPaymentTokenAccount: accounts.beneficiaryPaymentTokenAccount,
        mint: accounts.structuredProductMint,
        structuredProduct: structuredProductPDA.publicKey,
        snapshotConfig: snapshotConfigPDA.publicKey,
        paymentMint: accounts.paymentMint,
        payment: paymentPDA.publicKey,
        paymentTokenAccount,
        paymentPaid: paymentPaidPDA.publicKey,
        snapshotTransferHookProgram: this.transferSnapshotHookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }
  async waitForNewBlock(targetHeight: number) {
    console.log(`Waiting for new block with target height ${targetHeight}`);

    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve) => {
      const { lastValidBlockHeight } =
        await this.provider.connection.getLatestBlockhash("finalized");

      console.log("Current block height: ", lastValidBlockHeight);
      console.log("Target block height: ", lastValidBlockHeight + targetHeight);

      // Check if at least targetHeight amount of new blocks are generated every 1 second
      const intervalId = setInterval(async () => {
        const { lastValidBlockHeight: newValidBlockHeight } =
          await this.provider.connection.getLatestBlockhash();

        console.log("New block height: ", newValidBlockHeight);

        if (newValidBlockHeight > lastValidBlockHeight + targetHeight) {
          clearInterval(intervalId);
          resolve();
        }
      }, 100);
    });
  }

  async createLookupTable(keys: PublicKey[], waitForActivation = true) {
    const [createLookupTableIx, lookupTableAddress] =
      AddressLookupTableProgram.createLookupTable({
        authority: this.provider.publicKey,
        payer: this.provider.publicKey,
        recentSlot: await this.provider.connection.getSlot("finalized"),
      });

    const extendLookupTableIx = AddressLookupTableProgram.extendLookupTable({
      payer: this.provider.publicKey,
      authority: this.provider.publicKey,
      lookupTable: lookupTableAddress,
      addresses: keys,
    });
    await this.sendAndConfirmV0Tx([createLookupTableIx, extendLookupTableIx]);

    console.log("Created lookup table at: ", lookupTableAddress.toBase58());

    if (waitForActivation) {
      console.log("Waiting for lookup table to be activated...");
      await this.waitForNewBlock(1);
    }

    return lookupTableAddress;
  }

  async signStructuredProductInitOffline(
    config: SignStructuredProductInitOfflineConfig,
    mint: Keypair,
    noncePubkey: PublicKey
  ) {
    const advanceIx = SystemProgram.nonceAdvance({
      noncePubkey,
      authorizedPubkey: this.provider.publicKey,
    });

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

    const mintLen = getMintLen([ExtensionType.TransferHook]);

    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: this.provider.publicKey,
      space: mintLen,
      programId: TOKEN_2022_PROGRAM_ID,
      newAccountPubkey: mint.publicKey,
      lamports:
        await this.provider.connection.getMinimumBalanceForRentExemption(
          mintLen
        ),
    });

    const initIx = await this.createInitializeStructuredProductInstruction(
      {
        investor: config.investor,
        issuer: config.issuer,
        issuerTreasuryWallet: config.issuerTreasuryWallet,
        paymentMint: config.paymentMint,
      },
      mint,
      config.payments.length - 1, // principal uses same snapshot as last coupon,
      config.issuancePricePerUnit, // this is the principal amount,
      config.supply
    );

    const paymentIxs = await Promise.all(
      config.payments.map((p) =>
        this.getAddPaymentInstruction(
          {
            paymentMint: p.paymentMint,
            structuredProductMint: mint.publicKey,
            priceAuthority: p.priceAuthority,
          },
          p.paymentDateOffsetSeconds,
          p.principal,
          p.amount
        )
      )
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

    // const lookupTableAddress = await this.createLookupTable([
    //   this.program.programId,
    //   this.transferSnapshotHookProgram.programId,
    //   this.treasuryWalletProgram.programId,
    //   mint.publicKey,
    //   structuredProductPDA.publicKey,
    //   snapshotConfigPDA.publicKey,
    //   config.paymentMint,
    //   config.priceAuthority,
    //   config.investor,
    //   config.issuer,
    // ]);
    //
    // const lookupTableAccount =
    //   await this.provider.connection.getAddressLookupTable(lookupTableAddress);

    const accountInfo = await this.provider.connection.getAccountInfo(
      noncePubkey
    );

    const nonceAccount = NonceAccount.fromAccountData(accountInfo.data);

    const signedInitTx = await this.createAndSignV0Tx(
      [
        advanceIx,
        createMintAccountIx,
        initIx,
        ...paymentIxs,
        addAuthorizationIx,
      ],
      [mint],
      nonceAccount.nonce,
      []
    );

    return bs58.encode(signedInitTx.serialize());
  }

  async signStructuredProductIssueOffline(
    accounts: SignStructuredProductIssueOffline,
    noncePubkey: PublicKey
  ) {
    const accountInfo = await this.provider.connection.getAccountInfo(
      noncePubkey
    );

    const nonceAccount = NonceAccount.fromAccountData(accountInfo.data);

    const advanceIx = SystemProgram.nonceAdvance({
      noncePubkey,
      authorizedPubkey: this.provider.publicKey,
    });

    const structuredProductPDA = getPdaWithSeeds(
      [accounts.mint.toBuffer()],
      this.program.programId
    );
    const metadataPDA = getPdaWithSeeds(
      [
        Buffer.from("metadata"),
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID.toString()).toBuffer(),
        accounts.mint.toBuffer(),
      ],
      new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID.toString())
    );

    const addMetadataIx = await this.program.methods
      .createMetadata(
        "Encode Demo BRC",
        "eBRC",
        "https://shdw-drive.genesysgo.net/3V2fxRdcz9wE2MHoQUBxEEsDLKuUj5Nu9ZhxcJ1DA4ZX/metadata.json"
      )
      .accounts({
        mint: accounts.mint,
        metadata: metadataPDA.publicKey,
        authority: this.provider.publicKey,
        structuredProduct: structuredProductPDA.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        sysVar: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    const payIssuanceIx = await this.createPayIssuanceInstruction({
      mint: accounts.mint,
      paymentMint: accounts.paymentMint,
      payer: accounts.investor,
    });

    const issueIx = await this.createIssueInstruction({
      investor: accounts.investor,
      issuer: accounts.issuer,
      issuerTreasuryWallet: accounts.issuerTreasuryWallet,
      mint: accounts.mint,
    });

    const withdrawIssuanceProceedsIx =
      await this.createWithdrawIssuanceProceedsInstruction({
        mint: accounts.mint,
        paymentMint: accounts.paymentMint,
        issuer: accounts.issuer,
        beneficiaryTokenAccount: accounts.issuanceProceedsBeneficiary,
      });

    const signedIssueTx = await this.createAndSignV0Tx(
      [
        advanceIx,
        addMetadataIx,
        payIssuanceIx,
        issueIx,
        withdrawIssuanceProceedsIx,
      ],
      [],
      nonceAccount.nonce
    );

    return bs58.encode(signedIssueTx.serialize());
  }
  decodeV0Tx(issueTransaction: string) {
    return VersionedTransaction.deserialize(bs58.decode(issueTransaction));
  }

  async getPaymentTokenAccount(
    mint: PublicKey,
    paymentMint: PublicKey,
    principal: boolean,
    timestamp: BN
  ) {
    const paymentPDA = await this.getPaymentPda(mint, principal, timestamp);

    const paymentTokenAccountAddress = getAssociatedTokenAddressSync(
      paymentMint,
      paymentPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const paymentTokenAccountInfo =
      await this.provider.connection.getAccountInfo(paymentTokenAccountAddress);

    console.log("paymentTokenAccountInfo", paymentTokenAccountInfo);

    return unpackAccount(
      paymentTokenAccountAddress,
      paymentTokenAccountInfo,
      TOKEN_2022_PROGRAM_ID
    );
  }
}
