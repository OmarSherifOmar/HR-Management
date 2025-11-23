import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollPeriod, PayrollPeriodSchema } from './models/period.schema';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';

@Module({
    imports: [
    MongooseModule.forFeature([{ name: PayrollPeriod.name, schema: PayrollPeriodSchema }]),
    EmployeeModule,
  ],
    exports: [MongooseModule],
})
export class PayrollPeriodModule {}
