import { AnchorProvider } from '@coral-xyz/anchor';
import { getPdaWithSeeds, StructuredNotesSdk } from '@fqx/programs';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  unpackAccount,
} from '@solana/spl-token';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
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
export class StructuredProductService {
  private issuerSdk: StructuredNotesSdk;
  private serverSdk: StructuredNotesSdk;
  private readonly logger = new Logger(StructuredProductService.name);

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
    const serverKeypair = Keypair.fromSecretKey(serverSecretKey);

    this.issuerSdk = this.sdkFactory.getSdkForSigner(issuer);
    this.serverSdk = this.sdkFactory.getSdkForSigner(serverKeypair);
  }

  async deploy(structuredProductDeployDto: StructuredProductDeployDto) {
    const paymentMint = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );

    this.logger.log('Investor public key', structuredProductDeployDto.investorPublicKey);

    const investorATA = getAssociatedTokenAddressSync(
      paymentMint,
      new PublicKey(structuredProductDeployDto.investorPublicKey),
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    this.logger.log('Investor ATA', investorATA.toBase58());

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
        this.logger.log('Creating investor ATA');
        const createInvestorATAIx = createAssociatedTokenAccountInstruction(
          this.issuerSdk.provider.publicKey,
          investorATA,
          new PublicKey(structuredProductDeployDto.investorPublicKey),
          paymentMint,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        ixs.push(createInvestorATAIx);
      }
      this.logger.log('Minting payment token to investor');
      ixs.push(this.createMintPaymentTokenIx(investorATA, 1000000000000000n));
      const serverSecretKey = Uint8Array.from(
        JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
      );

      const mintAuthority = Keypair.fromSecretKey(serverSecretKey);
      signers.push(mintAuthority);
    }

    const treasuryWalletPublicKey = new PublicKey(
      this.configService.get<string>('TREASURY_WALLET_PUBLIC_KEY'),
    );

    this.logger.log(
      'Treasury wallet public key',
      treasuryWalletPublicKey.toBase58(),
    );

    const treasuryWalletAuthorityPDA = getPdaWithSeeds(
      [treasuryWalletPublicKey.toBuffer()],
      this.issuerSdk.treasuryWalletProgram.programId,
    );

    this.logger.log(
      'Treasury wallet authority PDA',
      treasuryWalletAuthorityPDA.publicKey.toBase58(),
    );

    const treasuryWalletATA = getAssociatedTokenAddressSync(
      paymentMint,
      treasuryWalletAuthorityPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    this.logger.log('Treasury wallet ATA', treasuryWalletATA.toBase58());

    const mint = Keypair.generate();

    const nonce1 = Keypair.generate();
    const nonce2 = Keypair.generate();

    const [nonce1Ixs, nonce2Ixs] = await Promise.all([
      this.issuerSdk.createDurableNonceAccountInstructions(nonce1),
      this.issuerSdk.createDurableNonceAccountInstructions(nonce2),
    ]);

    ixs.push(...nonce1Ixs, ...nonce2Ixs);
    signers.push(nonce1, nonce2);

    this.logger.log(
      'Signers',
      signers.map((s) => s.publicKey.toBase58()),
    );

    await this.issuerSdk.sendAndConfirmV0Tx(ixs, signers);

    const issuanceDate = new Date();
    const yieldValue = new BN(randomInt(0.2 * 10000, 0.4 * 10000));
    const couponPaymentAmount = new BN(structuredProductDeployDto.principal)
      .mul(yieldValue)
      .divn(10000)
      .divn(2);
    console.log({ yieldValue, couponPaymentAmount });
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
          issuerTreasuryWallet: treasuryWalletPublicKey,
          paymentMint: paymentMint,
          issuancePricePerUnit: new BN(structuredProductDeployDto.principal),
          supply: new BN(structuredProductDeployDto.totalIssuanceAmount).divn(
            structuredProductDeployDto.principal,
          ),
          payments: [
            {
              principal: false,
              amount: couponPaymentAmount,
              paymentDateOffsetSeconds: paymentDateOffsetSeconds,
              paymentMint: paymentMint,
            },
            {
              principal: false,
              amount: couponPaymentAmount,
              paymentDateOffsetSeconds: paymentDateOffsetSeconds.muln(2),
              paymentMint: paymentMint,
            },
            {
              principal: true,
              paymentDateOffsetSeconds: paymentDateOffsetSeconds.muln(2),
              paymentMint: paymentMint,
              priceAuthority: this.serverSdk.provider.publicKey,
            },
          ],
        },
        mint,
        nonce1.publicKey,
      );
    const encodedIssueSPTx =
      await this.issuerSdk.signStructuredProductIssueOffline(
        {
          investor: new PublicKey(structuredProductDeployDto.investorPublicKey),
          issuer: this.issuerSdk.provider.publicKey,
          issuerTreasuryWallet: treasuryWalletPublicKey,
          mint: mint.publicKey,
          paymentMint: paymentMint,
          issuanceProceedsBeneficiary: treasuryWalletATA,
        },
        nonce2.publicKey,
      );

    return {
      transactions: [encodedInitSPTx, encodedIssueSPTx],
      mint: mint.publicKey,
      yieldValue: yieldValue.toNumber() / 10000,
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

  async schedulePayment(schedulePaymentDto: {
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

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const paymentDate = new Date(
        activatedDate.add(snapshot).toNumber() * 1000,
      );
      this.logger.log('paymentTimestamp', paymentDate.toString());

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
