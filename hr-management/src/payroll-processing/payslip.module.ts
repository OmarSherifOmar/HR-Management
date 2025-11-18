import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayslipSchema, Payslip } from './models/payslip.schema';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';
import { PayGradeModule } from 'src/payroll-config/modules/pay-grade.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payslip.name, schema: PayslipSchema }]),
    EmployeeModule,
    PayGradeModule,
  ],
  exports: [MongooseModule],
})
export class PayslipModule {}
