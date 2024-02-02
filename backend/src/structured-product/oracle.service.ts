import { BN } from '@coral-xyz/anchor';
import { StructuredNotesSdk } from '@fqx/programs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Keypair, PublicKey } from '@solana/web3.js';
import { randomInt } from 'crypto';
import { SdkFactory } from 'src/solana-client/sdk-factory';

@Injectable()
export class OracleService {
  private serverSdk: StructuredNotesSdk;
  private readonly logger = new Logger(OracleService.name);
  private paymentMint: PublicKey;
  constructor(
    private readonly sdkFactory: SdkFactory,
    private readonly configService: ConfigService,
  ) {
    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    const serverKeypair = Keypair.fromSecretKey(serverSecretKey);
    this.serverSdk = this.sdkFactory.getSdkForSigner(serverKeypair);

    this.paymentMint = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );
  }
  @Interval(10000)
  async updatePricing() {
    this.logger.log('Update pricing');

    const oldPrice = await this.serverSdk.getCurrentPriceFromDummyOracle(
      'CRZYBTC',
      this.serverSdk.provider.publicKey,
    );
    console.log(oldPrice.currentPrice.toNumber());
    const onePercentValue = oldPrice.currentPrice.divn(100).toNumber();
    const newPriceDelta = new BN(
      this.randomNegativeOrPositiveInRange(onePercentValue),
    );
    const newPrice = oldPrice.currentPrice.add(newPriceDelta);
    const setPriceIx =
      await this.serverSdk.createSetPriceDummyOracleInstruction(
        'CRZYBTC',
        newPrice,
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

  randomNegativeOrPositiveInRange(range: number) {
    const plusOrMinus = Math.round(Math.random()) * 2 - 1;
    return new BN(randomInt(range) * plusOrMinus);
  }
}
