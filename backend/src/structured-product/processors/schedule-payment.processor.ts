import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { getPdaWithSeeds } from '@fqx/programs';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SOLANA_PROVIDER } from 'src/solana-client/contants';
import { SdkFactory } from 'src/solana-client/sdk-factory';

@Processor('schedule-payment')
export class SchedulePaymentProcessor {
  constructor(
    @Inject(SOLANA_PROVIDER)
    private readonly provider: AnchorProvider,
    private readonly sdkFactory: SdkFactory,
    private configService: ConfigService,
  ) {}
  @Process()
  async process(job) {
    const mintPublicKey = new PublicKey(job.data.mintPublicKey);

    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    const serverKeypair = Keypair.fromSecretKey(serverSecretKey);
    const sdk = this.sdkFactory.getSdkForSigner(serverKeypair);

    const snapshotConfigPDA = await getPdaWithSeeds(
      [Buffer.from('snapshots'), mintPublicKey.toBuffer()],
      sdk.transferSnapshotHookProgram.programId,
    );

    const { snapshots, ...snapshotConfig } =
      await sdk.transferSnapshotHookProgram.account.snapshotConfig.fetch(
        snapshotConfigPDA.publicKey,
      );

    const setPaymentIxs = await Promise.all(
      snapshots.map(async (snapshot) => {
        const paymentTimestamp = snapshotConfig.activatedDate.add(snapshot);
        console.log('paymentTimestamp', paymentTimestamp.toString());
        return await sdk.createSetPaymentPriceInstruction(
          mintPublicKey,
          true,
          new BN(100),
          paymentTimestamp,
        );
      }),
    );

    const setPaymentTxs = await sdk.sendAndConfirmV0Tx(setPaymentIxs);

    return setPaymentTxs;
  }
}
