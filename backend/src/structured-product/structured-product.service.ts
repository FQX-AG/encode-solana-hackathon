import { AnchorProvider } from '@coral-xyz/anchor';
import { getPdaWithSeeds, StructuredNotesSdk } from '@fqx/programs';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  unpackAccount,
  uiAmountToAmount,
  amountToUiAmount,
} from '@solana/spl-token';
import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import * as BN from 'bn.js';
import { Queue } from 'bull';
import { randomInt } from 'crypto';
import { SdkFactory } from 'src/solana-client/sdk-factory';
import { SOLANA_PROVIDER } from '../solana-client/contants';
import { StructuredProductDeployDto } from './dtos/structured-product-deploy.dto';
import { HandlePaymentJob } from './processors/handle-payment.processor';
import { differenceInSeconds } from 'date-fns';

export const DefaultTaskConfig = {
  attempts: 15,
  backoff: { type: 'fixed', delay: 2000 },
  removeOnComplete: 10000,
  removeOnFail: 10000,
  timeout: 180000,
};

export const getOneShotTaskConfigForDate = (
  dueDate: Date | string | number,
) => {
  return {
    ...DefaultTaskConfig,
    delay: new Date(dueDate).getTime() - Date.now(),
  };
};

@Injectable()
export class StructuredProductService implements OnModuleInit {
  private readonly logger = new Logger(StructuredProductService.name);

  private issuerSdk: StructuredNotesSdk;
  private serverSdk: StructuredNotesSdk;
  private readonly serverKeypair: Keypair;
  private readonly paymentMint: PublicKey;
  private readonly treasuryWalletPublicKey: PublicKey;
  private readonly programLookupTableAddress: PublicKey;

  private programLookupTable: AddressLookupTableAccount;

  constructor(
    @Inject(SOLANA_PROVIDER)
    private readonly provider: AnchorProvider,
    private configService: ConfigService,
    private sdkFactory: SdkFactory,
    @InjectQueue('handle-payment')
    private handlePaymentQueue: Queue<HandlePaymentJob>,
  ) {
    const issuerSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('ISSUER_SECRET_KEY')),
    );
    const issuer = Keypair.fromSecretKey(issuerSecretKey);

    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    this.serverKeypair = Keypair.fromSecretKey(serverSecretKey);

    this.issuerSdk = this.sdkFactory.getSdkForSigner(issuer);
    this.serverSdk = this.sdkFactory.getSdkForSigner(this.serverKeypair);

    this.paymentMint = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );
    this.treasuryWalletPublicKey = new PublicKey(
      this.configService.get<string>('TREASURY_WALLET_PUBLIC_KEY'),
    );

    this.programLookupTableAddress = new PublicKey(
      this.configService.get<string>('PROGRAM_LOOKUP_TABLE_ADDRESS'),
    );
  }

  async onModuleInit() {
    this.programLookupTable = (
      await this.serverSdk.provider.connection.getAddressLookupTable(
        this.programLookupTableAddress,
      )
    ).value;
  }

  async deploy(structuredProductDeployDto: StructuredProductDeployDto) {
    const investorATA = getAssociatedTokenAddressSync(
      this.paymentMint,
      new PublicKey(structuredProductDeployDto.investorPublicKey),
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const investorTokenAccountInfo =
      await this.issuerSdk.provider.connection.getAccountInfo(investorATA);

    const ixs: TransactionInstruction[] = [];
    let investorTokenAccount = null;

    if (investorTokenAccountInfo !== null) {
      investorTokenAccount = unpackAccount(
        investorATA,
        investorTokenAccountInfo,
        TOKEN_2022_PROGRAM_ID,
      );
    }

    const signers = [];
    if (
      investorTokenAccountInfo === null ||
      (investorTokenAccount && investorTokenAccount.amount === 0n)
    ) {
      if (investorTokenAccountInfo === null) {
        const createInvestorATAIx = createAssociatedTokenAccountInstruction(
          this.issuerSdk.provider.publicKey,
          investorATA,
          new PublicKey(structuredProductDeployDto.investorPublicKey),
          this.paymentMint,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        ixs.push(createInvestorATAIx);
      }
      ixs.push(this.createMintPaymentTokenIx(investorATA, 1000000000000000n));

      signers.push(this.serverKeypair);
    }

    const treasuryWalletAuthorityPDA = getPdaWithSeeds(
      [this.treasuryWalletPublicKey.toBuffer()],
      this.issuerSdk.treasuryWalletProgram.programId,
    );

    const treasuryWalletATA = getAssociatedTokenAddressSync(
      this.paymentMint,
      treasuryWalletAuthorityPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const mint = Keypair.generate();

    const nonce1 = Keypair.generate();
    const nonce2 = Keypair.generate();

    const [nonce1Ixs, nonce2Ixs] = await Promise.all([
      this.issuerSdk.createDurableNonceAccountInstructions(nonce1),
      this.issuerSdk.createDurableNonceAccountInstructions(nonce2),
    ]);

    ixs.push(...nonce1Ixs, ...nonce2Ixs);
    signers.push(nonce1, nonce2);

    await this.issuerSdk.sendAndConfirmV0Tx(ixs, signers);

    const dummyOraclePDA = getPdaWithSeeds(
      [this.serverSdk.provider.publicKey.toBuffer(), Buffer.from('CRZYBTC')],
      this.serverSdk.dummyOracleProgram.programId,
    );

    const issuanceDate = new Date();
    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    const mintAuthority = Keypair.fromSecretKey(serverSecretKey);
    const oracleAccount =
      await this.serverSdk.dummyOracleProgram.account.dummyOracleAccount.fetch(
        dummyOraclePDA.publicKey,
      );
    const uiPrincipal = structuredProductDeployDto.principal;
    const principal = await uiAmountToAmount(
      this.serverSdk.provider.connection,
      mintAuthority,
      this.paymentMint,
      uiPrincipal,
      TOKEN_2022_PROGRAM_ID,
    );
    const uiCoupon = new BN(
      randomInt(0.2 * Number(uiPrincipal), 0.25 * Number(uiPrincipal)),
    )
      .divn(2)
      .muln(2)
      .toString();
    const coupon = await uiAmountToAmount(
      this.serverSdk.provider.connection,
      mintAuthority,
      this.paymentMint,
      uiCoupon,
      TOKEN_2022_PROGRAM_ID,
    );
    const uiTotalIssuanceAmount =
      structuredProductDeployDto.totalIssuanceAmount;
    const totalIssuanceAmount = await uiAmountToAmount(
      this.serverSdk.provider.connection,
      mintAuthority,
      this.paymentMint,
      uiTotalIssuanceAmount,
      TOKEN_2022_PROGRAM_ID,
    );
    const initialFixingPrice = oracleAccount.currentPrice;
    const uiInitialFixingPrice = await amountToUiAmount(
      this.serverSdk.provider.connection,
      mintAuthority,
      this.paymentMint,
      BigInt(initialFixingPrice.toString()),
      TOKEN_2022_PROGRAM_ID,
    );
    if (
      typeof principal !== 'bigint' ||
      typeof coupon !== 'bigint' ||
      typeof totalIssuanceAmount !== 'bigint' ||
      typeof uiInitialFixingPrice !== 'string'
    ) {
      throw new Error('Failed to convert decimals.');
    }
    const supply = (totalIssuanceAmount / principal).toString();

    const paymentDateOffsetSeconds = new BN(
      differenceInSeconds(
        new Date(structuredProductDeployDto.maturityDate),
        new Date(issuanceDate),
      ),
    ).divn(2);
    const encodedInitSPTx =
      await this.issuerSdk.signStructuredProductInitOffline(
        {
          investor: new PublicKey(structuredProductDeployDto.investorPublicKey),
          issuer: this.issuerSdk.provider.publicKey,
          issuerTreasuryWallet: this.treasuryWalletPublicKey,
          payments: [
            {
              principal: false,
              amount: new BN((coupon / 2n).toString()),
              paymentDateOffsetSeconds: paymentDateOffsetSeconds,
              paymentMint: this.paymentMint,
            },
            {
              principal: false,
              amount: new BN((coupon / 2n).toString()),
              paymentDateOffsetSeconds: paymentDateOffsetSeconds.muln(2),
              paymentMint: this.paymentMint,
            },
            {
              principal: true,
              paymentDateOffsetSeconds: paymentDateOffsetSeconds.muln(2),
              paymentMint: this.paymentMint,
            },
          ],
          dummyOracle: dummyOraclePDA.publicKey,
          underlyingSymbol: 'CRZYBTC',
          paymentMint: this.paymentMint,
          initialPrincipal: new BN(principal.toString()),
          initialFixingPrice,
          barrierInBasisPoints: new BN(
            Math.round(structuredProductDeployDto.barrierLevel * 100), // convert to basis points
          ),
          supply: new BN(supply),
        },
        mint,
        nonce1.publicKey,
        [this.programLookupTable],
      );
    const encodedIssueSPTx =
      await this.issuerSdk.signStructuredProductIssueOffline(
        {
          investor: new PublicKey(structuredProductDeployDto.investorPublicKey),
          issuer: this.issuerSdk.provider.publicKey,
          issuerTreasuryWallet: this.treasuryWalletPublicKey,
          mint: mint.publicKey,
          paymentMint: this.paymentMint,
          issuanceProceedsBeneficiary: treasuryWalletATA,
        },
        nonce2.publicKey,
      );

    return {
      transactions: [encodedInitSPTx, encodedIssueSPTx],
      mint: mint.publicKey,
      principal: uiPrincipal,
      coupon: uiCoupon,
      totalIssuanceAmount: uiTotalIssuanceAmount,
      supply: supply,
      initialFixingPrice: uiInitialFixingPrice,
    };
  }

  createMintPaymentTokenIx(tokenAccount: PublicKey, amountToMint: bigint) {
    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    const mintAuthority = Keypair.fromSecretKey(serverSecretKey);

    const mintAddress = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );

    return createMintToCheckedInstruction(
      mintAddress,
      tokenAccount,
      mintAuthority.publicKey,
      amountToMint,
      9,
      [],
      TOKEN_2022_PROGRAM_ID,
    );
  }

  async confirmIssuance(schedulePaymentDto: {
    mint: string;
    investor: string;
  }) {
    const { mint: mintPubkeyString, investor } = schedulePaymentDto;
    const mint = new PublicKey(mintPubkeyString);

    const snapshotConfigPDA = getPdaWithSeeds(
      [Buffer.from('snapshots'), mint.toBuffer()],
      this.serverSdk.transferSnapshotHookProgram.programId,
    );

    const snapshotConfig =
      await this.serverSdk.transferSnapshotHookProgram.account.snapshotConfig.fetch(
        snapshotConfigPDA.publicKey,
      );

    const { snapshots, activatedDate } = snapshotConfig;

    const paymentsToSchedule: HandlePaymentJob[] = [];
    const beneficiary = new PublicKey(investor);

    const beneficiarySPATA = getAssociatedTokenAddressSync(
      mint,
      beneficiary,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const paymentMint = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );

    const beneficiaryPaymentTokenATA = getAssociatedTokenAddressSync(
      paymentMint,
      beneficiary,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    //
    // const structProductPDA = getPdaWithSeeds(
    //   [mint.toBuffer()],
    //   this.serverSdk.program.programId,
    // );
    //
    // const brcPDA = getPdaWithSeeds(
    //   [structProductPDA.publicKey.toBuffer()],
    //   this.serverSdk.brcProgram.programId,
    // );
    //
    // console.log('brcPDA', brcPDA.publicKey.toBase58());
    //
    // const brcAccount = await this.serverSdk.brcProgram.account.brc.fetch(
    //   brcPDA.publicKey,
    // );

    // console.log('brcAccount', brcAccount);

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const paymentDate = new Date(
        activatedDate.add(snapshot).toNumber() * 1000,
      );

      paymentsToSchedule.push({
        beneficiary: beneficiary.toBase58(),
        beneficiaryPaymentTokenAccount: beneficiaryPaymentTokenATA.toBase58(),
        beneficiaryTokenAccount: beneficiarySPATA.toBase58(),
        paymentDate: paymentDate,
        mint: mint.toBase58(),
        snapshotOffset: snapshot.toNumber(),
        principal: false,
      });

      if (i === snapshots.length - 1) {
        paymentsToSchedule.push({
          beneficiary: beneficiary.toBase58(),
          beneficiaryPaymentTokenAccount: beneficiaryPaymentTokenATA.toBase58(),
          beneficiaryTokenAccount: beneficiarySPATA.toBase58(),
          paymentDate: paymentDate,
          mint: mint.toBase58(),
          snapshotOffset: snapshot.toNumber(),
          principal: true,
        });
      }
    }

    await Promise.all(
      paymentsToSchedule.map((payment) =>
        this.handlePaymentQueue.add(
          payment,
          getOneShotTaskConfigForDate(payment.paymentDate),
        ),
      ),
    );
  }
}
