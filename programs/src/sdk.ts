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
import * as console from "console";
import { TreasuryWallet } from "./types/treasury_wallet";

export type InitializeAccounts = {
  investor: PublicKey;
  issuer: PublicKey;
  issuerTreasuryWallet: PublicKey;
};

export class StructuredNotesSdk {
  readonly provider: SolanaAugmentedProvider;
  readonly treasuryWalletProgram = anchor.workspace
    .TreasuryWallet as Program<TreasuryWallet>;

  constructor(
    connection: Connection,
    wallet: Wallet,
    public readonly program: Program<StructuredProduct>
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
    supply: number,
    mint: Keypair,
    accounts: InitializeAccounts
  ) {
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

    const issuerTreasuryWalletWithdrawAuthorization = getPdaWithSeeds(
      [
        accounts.issuerTreasuryWallet.toBuffer(),
        structuredProductPDA.publicKey.toBuffer(),
      ],
      this.treasuryWalletProgram.programId
    );

    return await this.program.methods
      .initialize(new BN(supply))
      .accounts({
        ...accounts,
        mint: mint.publicKey,
        structuredProduct: structuredProductPDA.publicKey,
        investorTokenAccount: investorATA,
        programTokenAccount: programATA,
        issuerTreasuryWallet: accounts.issuerTreasuryWallet,
        issuerTreasuryWalletWithdrawAuthorization:
          issuerTreasuryWalletWithdrawAuthorization.publicKey,
        treasuryWalletProgram: this.treasuryWalletProgram.programId,
        // snapshotTransferHookProgram: transferSnapshotHookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([mint])
      .instruction();
  }

  async signInitializeOffline(
    supply: number,
    accounts: InitializeAccounts,
    nonceAccount: NonceAccount,
    noncePubkey: PublicKey
  ) {
    const mint = Keypair.generate();

    console.log("Mint: ", mint.publicKey.toBase58());
    const tx = new Transaction();

    const advanceIx = SystemProgram.nonceAdvance({
      noncePubkey,
      authorizedPubkey: this.provider.walletKey,
    });

    const initIx = await this.getInitializeInstruction(supply, mint, accounts);
    tx.add(advanceIx);
    tx.add(initIx);

    const structuredProductPDA = getPdaWithSeeds(
      [mint.publicKey.toBuffer()],
      this.program.programId
    );

    const withdrawAuthorizationPDA = getPdaWithSeeds(
      [
        accounts.issuerTreasuryWallet.toBuffer(),
        structuredProductPDA.publicKey.toBuffer(),
      ],
      this.treasuryWalletProgram.programId
    );

    tx.add(
      await this.treasuryWalletProgram.methods
        .addWithdrawAuthorization()
        .accounts({
          owner: accounts.issuer,
          treasuryWallet: accounts.issuerTreasuryWallet,
          authority: structuredProductPDA.publicKey,
          withdrawAuthorization: withdrawAuthorizationPDA.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );
    tx.recentBlockhash = nonceAccount.nonce;
    tx.feePayer = accounts.investor;
    tx.partialSign(mint);

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
    return bs58.encode(signedTx.serialize({ requireAllSignatures: false }));
  }
  async signAndBroadcastInitialize(initializeTransaction: string) {
    const tx = Transaction.from(bs58.decode(initializeTransaction));
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
}
