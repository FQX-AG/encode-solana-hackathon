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
    const relativeChangeRangeLimit = 0.1;
    const absoluteChangeRangeLimit = oldPrice.currentPrice
      .muln(relativeChangeRangeLimit)
      .toNumber();

    // Generate a Gaussian random number
    const randomChange = this.gaussianRandom(0, 0.3) * absoluteChangeRangeLimit;

    const newPriceDelta = new BN(randomChange);
    const newPrice = oldPrice.currentPrice.add(newPriceDelta);
    const setPriceIx =
      await this.serverSdk.createSetPriceDummyOracleInstruction(
        'CRZYBTC',
        BN.max(
          BN.min(newPrice, new BN('120000000000000')),
          new BN('2000000000000'),
        ),
      );

    this.logger.log({
      msg: 'Setting new Price',
      newPrice: toUiAmount(newPrice, 9).toString(),
      newPriceDelta: toUiAmount(newPriceDelta, 9).toString(),
    });

    const updatePriceTxId = await this.serverSdk.sendAndConfirmV0Tx([
      setPriceIx,
    ]);

    this.logger.log({
      msg: 'Price updated',
      newPrice: toUiAmount(newPrice, 9).toString(),
      txId: updatePriceTxId,
    });
  }
}
