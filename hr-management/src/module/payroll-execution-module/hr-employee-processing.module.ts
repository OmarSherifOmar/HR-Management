import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HREventProcessing,
  HREventProcessingSchema,
} from '../../models/payroll-execution/hr-employee-processing.schema';

const hrEmployeeProcessingModel = MongooseModule.forFeature([
  { name: HREventProcessing.name, schema: HREventProcessingSchema },
]);

@Module({
  imports: [hrEmployeeProcessingModel],
  exports: [hrEmployeeProcessingModel],
})
export class HREmployeeProcessingModule {}
