import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HREventProcessing, HREventProcessingSchema } from './models/hr-employee-processing.schema';
import {PayrollRunModule} from './run.module';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';
import { DepartmentModule } from 'src/employee-organization-performancesubsystem/organization/department.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HREventProcessing.name, schema: HREventProcessingSchema },
    ]),
    PayrollRunModule,
    EmployeeModule,
    DepartmentModule,
  ],
  exports: [MongooseModule],
})
export class HREventProcessingModule {}
