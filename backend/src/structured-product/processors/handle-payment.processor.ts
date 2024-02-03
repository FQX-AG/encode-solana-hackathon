import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SOLANA_PROVIDER } from 'src/solana-client/contants';
import { SdkFactory } from 'src/solana-client/sdk-factory';
import { Job } from 'bull';
import { getPdaWithSeeds, StructuredNotesSdk } from '@fqx/programs';

export type HandlePaymentJob = {
  mint: string;
  paymentDate: Date;
  snapshotOffset: number;
  principal: boolean;
  beneficiary: string;
  beneficiaryTokenAccount: string;
  beneficiaryPaymentTokenAccount: string;
};

@Processor('handle-payment')
export class HandlePaymentProcessor {
  private readonly logger = new Logger(HandlePaymentProcessor.name);
  private sdk: StructuredNotesSdk;
  constructor(
    @Inject(SOLANA_PROVIDER)
    private readonly provider: AnchorProvider,
    private readonly sdkFactory: SdkFactory,
    private configService: ConfigService,
  ) {
    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    const serverKeypair = Keypair.fromSecretKey(serverSecretKey);
    this.sdk = this.sdkFactory.getSdkForSigner(serverKeypair);
  }
  @Process()
  async process(job: Job<HandlePaymentJob>) {
    const mint = new PublicKey(job.data.mint);

    const ixs: TransactionInstruction[] = [];

    const dummyOraclePDA = getPdaWithSeeds(
      [this.provider.publicKey.toBuffer(), Buffer.from('CRZYBTC')],
      this.sdk.dummyOracleProgram.programId,
    );

    if (job.data.principal) {
      const setPriceIx = await this.sdk.createSetPaymentPriceInstruction(
        'CRZYBTC',
        mint,
        dummyOraclePDA.publicKey,
        new BN(job.data.snapshotOffset),
      );
      ixs.push(setPriceIx);
    }

    const paymentMint = new PublicKey(
      this.configService.get('PAYMENT_TOKEN_MINT_ADDRESS'),
    );

    const treasuryWallet = new PublicKey(
      this.configService.get('TREASURY_WALLET_PUBLIC_KEY'),
    );
    const pullPaymentIx = await this.sdk.createPullPaymentInstruction(
      {
        paymentMint,
        structuredProductMint: mint,
        treasuryWallet,
      },
      job.data.principal,
      new BN(job.data.snapshotOffset),
    );

    ixs.push(pullPaymentIx);

    const settlePaymentIx = await this.sdk.createSettlePaymentInstruction(
      {
        paymentMint,
        structuredProductMint: mint,
        beneficiaryPaymentTokenAccount: new PublicKey(
          job.data.beneficiaryPaymentTokenAccount,
        ),
        beneficiaryTokenAccount: new PublicKey(
          job.data.beneficiaryTokenAccount,
        ),
        beneficiary: new PublicKey(job.data.beneficiary),
      },
      job.data.principal,
      new BN(job.data.snapshotOffset),
    );

    ixs.push(settlePaymentIx);

    const settlePaymentX = await this.sdk.createAndSignV0Tx(ixs);

    this.logger.log({
      simulationLogs: (
        await this.sdk.provider.connection.simulateTransaction(settlePaymentX, {
          sigVerify: true,
        })
      ).value.logs,
    });

    return await this.sdk.sendAndConfirmV0Tx(ixs);
  }
}
