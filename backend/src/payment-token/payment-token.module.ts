import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SolanaClientModule } from 'src/solana-client/solana-client.module';
import { PaymentTokenController } from './payment-token.controller';
import { PaymentTokenService } from './payment-token.service';

@Module({
  imports: [ConfigModule, SolanaClientModule],
  controllers: [PaymentTokenController],
  providers: [PaymentTokenService],
})
export class PaymentTokenModule {}
