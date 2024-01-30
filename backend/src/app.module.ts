import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { StructuredProductModule } from './structured-product/structured-product.module';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { PaymentTokenModule } from './payment-token/payment-token.module';

@Module({
  imports: [
    StructuredProductModule,
    PaymentTokenModule,
    ConfigModule.forRoot(),
    // BullModule.forRoot({
    //   redis: {
    //     host: 'localhost', // replace that with google redis info or local redis docker compose service
    //     port: 6379,
    //   },
    // }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
