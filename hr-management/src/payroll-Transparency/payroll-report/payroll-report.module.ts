import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollReport, PayrollReportSchema } from '../models/payroll-report.schema';
import { DepartmentModule } from 'src/employee-organization-performancesubsystem/organization/department.module';
import { PayrollReportService } from './payroll-report.service';
import { PayrollReportController } from './payroll-report.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: PayrollReport.name, schema: PayrollReportSchema }]), DepartmentModule],
  exports: [MongooseModule],
  controllers: [PayrollReportController],
  providers: [PayrollReportService],
})
export class PayrollReportModule {}
