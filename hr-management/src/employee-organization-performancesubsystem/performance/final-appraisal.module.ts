import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinalAppraisalRecord, FinalAppraisalRecordSchema } from './models/final-appraisal-record.schema';
import { EmployeeAppraisalHistory, EmployeeAppraisalHistorySchema } from './models/employee-appraisal-history.schema';
import { FinalAppraisalService } from './final-appraisal.service';
import { FinalAppraisalController } from './final-appraisal.controller';
import { EmployeeModule } from '../employee/employee.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FinalAppraisalRecord.name, schema: FinalAppraisalRecordSchema },
      { name: EmployeeAppraisalHistory.name, schema: EmployeeAppraisalHistorySchema },
    ]),
  ],
  providers: [FinalAppraisalService],
  controllers: [FinalAppraisalController],
  exports: [FinalAppraisalService],
})
export class FinalAppraisalModule {}
