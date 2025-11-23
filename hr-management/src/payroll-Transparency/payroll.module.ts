import { Module } from '@nestjs/common';
import { PayrollDisputeModule } from './payroll-dispute/payroll-dispute.module';
import { PayrollReportModule } from './payroll-report/payroll-report.module';
import { SalaryHistoryModule } from './salary-history/salary-history.module';
import { TaxDocumentModule } from './tax-document/tax-document.module';
import { ClaimModule } from './claim/claim.module';
import { TaxModule } from './tax/tax.module';
@Module({
  imports: [
    PayrollDisputeModule,
    PayrollReportModule,
    SalaryHistoryModule,
    TaxDocumentModule,
    ClaimModule,
    TaxModule,
  ],
  exports: [
    PayrollDisputeModule,
    PayrollReportModule,
    SalaryHistoryModule,
    TaxDocumentModule,
    ClaimModule,
    TaxModule,
  ],
})
export class PayrollModule {}
