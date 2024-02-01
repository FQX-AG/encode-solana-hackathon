import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SolanaClientModule } from 'src/solana-client/solana-client.module';
import { StructuredProductController } from './structured-product.controller';
import { StructuredProductService } from './structured-product.service';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { SchedulePaymentProcessor } from './processors/schedule-payment.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'schedule-payment',
    }),
    BullBoardModule.forFeature({
      name: 'schedule-payment',
      adapter: BullMQAdapter,
    }),
    SolanaClientModule,
    ConfigModule,
  ],
  controllers: [StructuredProductController],
  providers: [StructuredProductService, SchedulePaymentProcessor],
})
export class StructuredProductModule {}
