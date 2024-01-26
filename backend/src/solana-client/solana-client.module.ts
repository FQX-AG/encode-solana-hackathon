import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SdkFactory } from 'src/solana-client/sdk-factory';
import { solanaProviderFactory } from './solana-provider.factory';

@Module({
  imports: [ConfigModule],
  providers: [solanaProviderFactory, SdkFactory],
  exports: [solanaProviderFactory, SdkFactory],
})
export class SolanaClientModule {}
