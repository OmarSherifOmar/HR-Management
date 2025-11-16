import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppraisalDispute, AppraisalDisputeSchema } from './models/appraisal-dispute.schema';
import { AppraisalDisputeService } from './appraisal-dispute.service';
import { AppraisalDisputeController } from './appraisal-dispute.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppraisalDispute.name, schema: AppraisalDisputeSchema }
    ]),
  ],
  providers: [AppraisalDisputeService],
  controllers: [AppraisalDisputeController],
  exports: [AppraisalDisputeService],
})
export class AppraisalDisputeModule {}
