import { BN } from '@coral-xyz/anchor';
import { StructuredNotesSdk } from '@fqx/programs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Keypair } from '@solana/web3.js';
import { randomInt } from 'crypto';
import { SdkFactory } from 'src/solana-client/sdk-factory';

@Injectable()
export class OracleService {
  private serverSdk: StructuredNotesSdk;
  private readonly logger = new Logger(OracleService.name);
  constructor(
    private readonly sdkFactory: SdkFactory,
    private readonly configService: ConfigService,
  ) {
    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    const serverKeypair = Keypair.fromSecretKey(serverSecretKey);
    this.serverSdk = this.sdkFactory.getSdkForSigner(serverKeypair);
  }
  @Interval(10000)
  async updatePricing() {
    this.logger.log('Update pricing');

    const setPriceIx =
      await this.serverSdk.createSetPriceDummyOracleInstruction(
        'BTC',
        this.randomBNInRange(15000, 250000),
      );

    const setPrixTx = await this.serverSdk.createAndSignV0Tx([setPriceIx]);
    this.logger.log(
      'Simulation: ',
      await this.serverSdk.provider.connection.simulateTransaction(setPrixTx, {
        sigVerify: true,
      }),
    );
    return this.serverSdk.sendAndConfirmV0Tx([setPriceIx]);
  }

  randomBNInRange(min: number, max: number) {
    return new BN(min + randomInt(max - min));
  }
}
