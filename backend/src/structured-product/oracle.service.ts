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
    const oldPrice = await this.serverSdk.getCurrentPriceFromDummyOracle(
      'CRZYBTC',
      this.serverSdk.provider.publicKey,
    );
    const onePercentValue = oldPrice.currentPrice.divn(20).toNumber();
    const newPriceDelta = new BN(
      this.randomNegativeOrPositiveInRange(onePercentValue),
    );
    const newPrice = oldPrice.currentPrice.add(newPriceDelta);
    const setPriceIx =
      await this.serverSdk.createSetPriceDummyOracleInstruction(
        'CRZYBTC',
        newPrice,
      );
    this.logger.log({
      msg: 'Setting new Price',
      newPrice: newPrice.toString(),
    });
    const updatePriceTxId = await this.serverSdk.sendAndConfirmV0Tx([
      setPriceIx,
    ]);
    this.logger.log({
      msg: 'Price updated',
      newPrice: newPrice,
      txId: updatePriceTxId,
    });
  }

  randomNegativeOrPositiveInRange(range: number) {
    const plusOrMinus = Math.round(Math.random()) * 2 - 1;
    return new BN(randomInt(range) * plusOrMinus);
  }
}
