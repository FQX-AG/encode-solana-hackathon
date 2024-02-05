import { BN } from '@coral-xyz/anchor';
import { StructuredNotesSdk } from '@fqx/programs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SdkFactory } from 'src/solana-client/sdk-factory';
import { uiAmountToAmount } from '@solana/spl-token';

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

  private adjustForAsymmetry(delta: number, sigma: number) {
    if (delta < 0) {
      // Adjust for the asymmetry in percentage change
      return delta / (1 - sigma);
    }
    return delta;
  }

  @Interval(5000)
  async updatePricing() {
    const oldPrice = await this.serverSdk.getCurrentPriceFromDummyOracle(
      'CRZYBTC',
      this.serverSdk.provider.publicKey,
    );
    const sigmaToPriceRatio = 0.05;
    const sigma = oldPrice.currentPrice.muln(sigmaToPriceRatio).toNumber();

    const targetMeanPrice = 42000000000000;

    const correctiveMean =
      (1 - oldPrice.currentPrice.toNumber() / targetMeanPrice) *
      0.01 *
      targetMeanPrice;

    const newPriceDeltaRaw = this.gaussianRandom(correctiveMean, sigma);
    // Adjust the delta for the asymmetric nature of percentage changes
    const newPriceDeltaAdjusted = this.adjustForAsymmetry(
      newPriceDeltaRaw,
      sigmaToPriceRatio,
    );

    const newPriceDelta = new BN(newPriceDeltaAdjusted);
    const newPrice = oldPrice.currentPrice.add(newPriceDelta);
    const setPriceIx =
      await this.serverSdk.createSetPriceDummyOracleInstruction(
        'CRZYBTC',
        newPrice,
      );

    this.logger.log(
      {
        oldPrice: toUiAmount(oldPrice.currentPrice, 9).toString(),
        mean: toUiAmount(new BN(correctiveMean), 9).toString(),
        newPriceDelta: toUiAmount(newPriceDelta, 9).toString(),
        newPrice: toUiAmount(newPrice, 9).toString(),
      },
      'Updating price',
    );

    const updatePriceTxId = await this.serverSdk.sendAndConfirmV0Tx(
      [setPriceIx],
      [],
      undefined,
      [],
      'processed',
    );

    this.logger.log(
      {
        newPrice: toUiAmount(newPrice, 9).toString(),
        txId: updatePriceTxId,
      },
      'Price updated',
    );
  }
}
