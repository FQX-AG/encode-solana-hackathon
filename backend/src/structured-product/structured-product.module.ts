import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SolanaClientModule } from 'src/solana-client/solana-client.module';
import { StructuredProductController } from './structured-product.controller';
import { StructuredProductService } from './structured-product.service';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HackathonTestProcessor } from './processors/hackathon-test.processor';
import * as basicAuth from 'express-basic-auth';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'hackathon-test',
    }),
    BullBoardModule.forFeature({
      name: 'hackathon-test',
      adapter: BullMQAdapter,
    }),
    SolanaClientModule,
    ConfigModule,
  ],
  controllers: [StructuredProductController],
  providers: [StructuredProductService, HackathonTestProcessor],
})
export class StructuredProductModule {}
