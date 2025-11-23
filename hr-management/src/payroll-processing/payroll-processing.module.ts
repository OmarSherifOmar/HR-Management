import { Module } from '@nestjs/common';
import { BankFileModule } from './bank-file.module';
import { PayrollDraftEntryModule } from './draft-entry.module';
import { PayrollFreezeModule } from './freeze.module';
import { HREventProcessingModule } from './hr-employee-processing.module';
import { PayrollApprovalWorkflowModule } from './payroll-approval-workflow.module';
import { PayrollCompanyModule } from './payroll-company.module';
import { PayrollExceptionModule } from './payroll-exception.module';
import { PayslipModule } from './payslip.module';
import { PayrollPeriodModule } from './period.module';
import { PayrollRunModule } from './run.module';

@Module({
  imports: [
    BankFileModule,
    PayrollDraftEntryModule,
    PayrollFreezeModule,
    HREventProcessingModule,
    PayrollApprovalWorkflowModule,
    PayrollCompanyModule,
    PayrollExceptionModule,
    PayslipModule,
    PayrollPeriodModule,
    PayrollRunModule,
  ],
  exports: [
    BankFileModule,
    PayrollDraftEntryModule,
    PayrollFreezeModule,
    HREventProcessingModule,
    PayrollApprovalWorkflowModule,
    PayrollCompanyModule,
    PayrollExceptionModule,
    PayslipModule,
    PayrollPeriodModule,
    PayrollRunModule,
  ],
})
export class PayrollProcessingModule {}
