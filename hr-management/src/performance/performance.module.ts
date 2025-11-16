import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RatingScaleSchema } from './models/rating-scale.schema';
import { AppraisalFormSchema } from './models/appraisal-form.schema';
import { AppraisalTemplateSchema } from './models/appraisal-template.schema';
import { AppraisalCycleSchema } from './models/appraisal-cycle.schema';
import { AppraisalAssignmentSchema } from './models/appraisal-assignment.schema';
// import { PerformanceService } from './performance.service';
// import { PerformanceController } from './performance.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RatingScale', schema: RatingScaleSchema },
      { name: 'AppraisalTemplate', schema: AppraisalTemplateSchema },
      { name: 'AppraisalCycle', schema: AppraisalCycleSchema },
      { name: 'AppraisalAssignment', schema: AppraisalAssignmentSchema },
      { name: 'AppraisalForm', schema: AppraisalFormSchema },
    ]),
  ],
  
  exports: [MongooseModule],
})
export class AppraisalModule {}
