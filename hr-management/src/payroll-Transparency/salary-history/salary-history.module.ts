import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalaryHistoryService } from './salary-history.service';
import { SalaryHistoryController } from './salary-history.controller';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';
import { PayslipModule } from 'src/payroll-processing/payslip.module';
import { SalaryHistorySchema } from '../models/salary-history.schema';
@Module({
  controllers: [SalaryHistoryController],
  providers: [SalaryHistoryService],
  imports: [MongooseModule.forFeature([{ name: 'SalaryHistory', schema: SalaryHistorySchema }]), EmployeeModule, PayslipModule],
  exports: [MongooseModule],
})
export class SalaryHistoryModule {}
