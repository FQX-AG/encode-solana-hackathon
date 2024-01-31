import { Body, Controller, Post } from '@nestjs/common';
import { StructuredProductDeployDto } from './dtos/structured-product-deploy.dto';
import { StructuredProductService } from './structured-product.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Controller('structured-product')
export class StructuredProductController {
  constructor(
    private structuredProductService: StructuredProductService,
    @InjectQueue('hackathon-test') private hackathonTestQueue: Queue,
  ) {}

  @Post()
  async deploy(@Body() structuredProductDeployDto: StructuredProductDeployDto) {
    return this.structuredProductService.deploy(structuredProductDeployDto);
  }

  @Post('queue')
  async deployWithQueue() {
    console.log(this.hackathonTestQueue.client.status);
    const job = await this.hackathonTestQueue.add({
      test: 'test',
    });
    return job;
  }
}
