import { Body, Controller, Post } from '@nestjs/common';
import { PaymentTokenService } from './payment-token.service';

@Controller('payment-token')
export class PaymentTokenController {
  constructor(private paymentTokenService: PaymentTokenService) {}

  @Post('mint')
  async mintPaymentToken(
    @Body() body: { owner: string; amountToMint: number },
  ) {
    const { owner, amountToMint } = body;
    return this.paymentTokenService.mintPaymentToken(
      owner,
      BigInt(amountToMint),
    );
  }
}
