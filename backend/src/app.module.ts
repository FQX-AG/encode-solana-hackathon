import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { StructuredProductModule } from './structured-product/structured-product.module';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { ConfigModule } from '@nestjs/config';
import { PaymentTokenModule } from './payment-token/payment-token.module';
import * as basicAuth from 'express-basic-auth';

@Module({
  imports: [
    StructuredProductModule,
    PaymentTokenModule,
    ConfigModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
    }),
    BullBoardModule.forRoot({
      route: '/worker',
      adapter: ExpressAdapter,
      middleware:
        process.env.NODE_ENV === 'development'
          ? undefined
          : basicAuth({
              users: {
                fqx: process.env.BULL_BOARD_PASSWORD,
              },
              challenge: true,
            }),
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
