import { Module } from '@nestjs/common';
import { PayrollReportService } from './payroll-report.service';
import { PayrollReportController } from './payroll-report.controller';

@Module({
  controllers: [PayrollReportController],
  providers: [PayrollReportService],
})
export class PayrollReportModule {}
