import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppraisalProgress, AppraisalProgressSchema } from './models/appraisal-progress.schema';
import { AppraisalProgressService } from './appraisal-progress.service';
import { AppraisalProgressController } from './appraisal-progress.controller';
import { DepartmentModule } from '../organization/department.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppraisalProgress.name, schema: AppraisalProgressSchema },
    ]),
  ],
  controllers: [AppraisalProgressController],
  providers: [AppraisalProgressService],
  exports: [AppraisalProgressService],
})
export class AppraisalProgressModule {}
