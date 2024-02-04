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

  @Interval(5000)
  async updatePricing() {
    // Utility function to generate Gaussian random numbers
    function gaussianRandom(mean, sigma) {
      let u = 0,
        v = 0;
      while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
      while (v === 0) v = Math.random();
      const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return num * sigma + mean;
    }

    const oldPrice = await this.serverSdk.getCurrentPriceFromDummyOracle(
      'CRZYBTC',
      this.serverSdk.provider.publicKey,
    );
    const relativeChangeRangeLimit = 0.1;
    const absoluteChangeRangeLimit = oldPrice.currentPrice
      .muln(relativeChangeRangeLimit)
      .toNumber();

    // Generate a Gaussian random number
    const randomChange = gaussianRandom(0, 1) * absoluteChangeRangeLimit;

    const newPriceDelta = new BN(randomChange);
    const newPrice = oldPrice.currentPrice.add(newPriceDelta);
    const setPriceIx =
      await this.serverSdk.createSetPriceDummyOracleInstruction(
        'CRZYBTC',
        newPrice,
      );

    this.logger.log({
      msg: 'Setting new Price',
      newPrice: newPrice.toString(),
      newPriceDelta: newPriceDelta.toString(),
    });

    const updatePriceTxId = await this.serverSdk.sendAndConfirmV0Tx([
      setPriceIx,
    ]);

    this.logger.log({
      msg: 'Price updated',
      newPrice: newPrice.toString(),
      txId: updatePriceTxId,
    });
  }
}
