import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SolanaClientModule } from 'src/solana-client/solana-client.module';
import { StructuredProductController } from './structured-product.controller';
import { StructuredProductService } from './structured-product.service';

@Module({
  imports: [
    // BullModule.registerQueue({
    //   name: '',
    // }),
    SolanaClientModule,
    ConfigModule,
  ],
  controllers: [StructuredProductController],
  providers: [StructuredProductService],
})
export class StructuredProductModule {}
