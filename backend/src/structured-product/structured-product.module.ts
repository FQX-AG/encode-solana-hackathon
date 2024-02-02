import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SolanaClientModule } from 'src/solana-client/solana-client.module';
import { StructuredProductController } from './structured-product.controller';
import { StructuredProductService } from './structured-product.service';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HandlePaymentProcessor } from './processors/handle-payment.processor';
import { OracleService } from './oracle.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'handle-payment',
    }),
    BullBoardModule.forFeature({
      name: 'handle-payment',
      adapter: BullMQAdapter,
    }),
    SolanaClientModule,
    ConfigModule,
  ],
  controllers: [StructuredProductController],
  providers: [StructuredProductService, HandlePaymentProcessor, OracleService],
})
export class StructuredProductModule {}
