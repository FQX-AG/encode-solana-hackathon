import { BN } from '@coral-xyz/anchor';
import { StructuredNotesSdk } from '@fqx/programs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SdkFactory } from 'src/solana-client/sdk-factory';

function toUiAmount(amount: BN, decimals: number) {
  return amount.div(new BN(10).pow(new BN(decimals)));
}

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

  // Utility function to generate Gaussian random numbers
  private gaussianRandom(mean, sigma) {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * sigma + mean;
  }

  @Interval(5000)
  async updatePricing() {
    const oldPrice = await this.serverSdk.getCurrentPriceFromDummyOracle(
      'CRZYBTC',
      this.serverSdk.provider.publicKey,
    );
    const relativeChangeScaler = 0.1;
    const absoluteChangeScaler = oldPrice.currentPrice
      .muln(relativeChangeScaler)
      .toNumber();

    const targetMeanPrice = 42000000000000;

    const mean =
      (1 - oldPrice.currentPrice.toNumber() / targetMeanPrice) * 0.01;

    const newPriceDelta = new BN(
      this.gaussianRandom(mean, 0.5) * absoluteChangeScaler,
    );
    const newPrice = oldPrice.currentPrice.add(newPriceDelta);
    const setPriceIx =
      await this.serverSdk.createSetPriceDummyOracleInstruction(
        'CRZYBTC',
        newPrice,
      );

    this.logger.log({
      msg: 'Setting new Price',
      oldPrice: toUiAmount(oldPrice.currentPrice, 9).toString(),
      mean,
      newPriceDelta: toUiAmount(newPriceDelta, 9).toString(),
      newPrice: toUiAmount(newPrice, 9).toString(),
    });

    const updatePriceTxId = await this.serverSdk.sendAndConfirmV0Tx(
      [setPriceIx],
      [],
      undefined,
      [],
      'processed',
    );

    this.logger.log({
      msg: 'Price updated',
      newPrice: toUiAmount(newPrice, 9).toString(),
      txId: updatePriceTxId,
    });
  }
}
