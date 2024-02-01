import { Body, Controller, Post } from '@nestjs/common';
import { StructuredProductDeployDto } from './dtos/structured-product-deploy.dto';
import { StructuredProductService } from './structured-product.service';

@Controller('')
export class StructuredProductController {
  constructor(private structuredProductService: StructuredProductService) {}

  @Post('mock-issuer')
  async deploy(@Body() structuredProductDeployDto: StructuredProductDeployDto) {
    return this.structuredProductService.deploy(structuredProductDeployDto);
  }

  @Post('confirm-issuance') // TODO: Rename
  async schedulePayment(
    @Body()
    schedulePaymentDto: {
      mint: string;
      txId: string;
      investor: string;
    },
  ) {
    return this.structuredProductService.schedulePayment(schedulePaymentDto);
  }
}
