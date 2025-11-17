import { Module } from '@nestjs/common';

import { AllowanceModule } from './modules/allowance.module';
import { DeductionModule } from './modules/deduction.module';
import { PayTypeModule } from './modules/pay-type.module';
import { PayGradeModule } from './modules/pay-grade.module';
import { PayrollPolicyModule } from './modules/payroll-policy.module';
import { BonusModule } from './modules/bonus.module';
import { SeparationBenefitModule } from './modules/separation-benefit.module';
import { ConfigDraftModule } from './modules/config-draft.module';
import { ApprovalRequestModule } from './modules/approval-request.module';
import { ApprovalEventModule } from './modules/approval-event.module';
import { CompanySettingsModule } from './modules/company-settings.module';
import { BackupPolicyModule } from './modules/backup-policy.module';


@Module({
  imports: [
    AllowanceModule,
    DeductionModule,
    PayTypeModule,
    PayGradeModule,
    PayrollPolicyModule,
    BonusModule,
    SeparationBenefitModule,
    ConfigDraftModule,
    ApprovalRequestModule,
    ApprovalEventModule,
    CompanySettingsModule,
    BackupPolicyModule,
  ],
  exports: [
    AllowanceModule,
    DeductionModule,
    PayTypeModule,
    PayGradeModule,
    PayrollPolicyModule,
    BonusModule,
    SeparationBenefitModule,
    ConfigDraftModule,
    ApprovalRequestModule,
    ApprovalEventModule,
    CompanySettingsModule,
    BackupPolicyModule,
  ],
})
export class PayrollConfigModule {}
