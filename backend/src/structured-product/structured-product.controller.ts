import { Body, Controller, Post } from '@nestjs/common';
import { StructuredProductDeployDto } from './dtos/structured-product-deploy.dto';
import { StructuredProductService } from './structured-product.service';

@Controller('structured-product')
export class StructuredProductController {
  constructor(private structuredProductService: StructuredProductService) {}

  @Post()
  async deploy(@Body() structuredProductDeployDto: StructuredProductDeployDto) {
    return this.structuredProductService.deploy(structuredProductDeployDto);
  }

  @Post('payment-token/mint')
  async mintPaymentToken(
    @Body() body: { owner: string; amountToMint: number },
  ) {
    const { owner, amountToMint } = body;
    return this.structuredProductService.mintPaymentToken(
      owner,
      BigInt(amountToMint),
    );
  }
}
