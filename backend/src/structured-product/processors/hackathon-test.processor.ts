import { Process, Processor } from '@nestjs/bull';

@Processor('hackathon-test')
export class HackathonTestProcessor {
  @Process()
  async process(job) {
    console.log(job.data);
    return {};
  }
}
