import { Module } from '@nestjs/common';
import { PayrollConfigurationController } from './payroll-configuration.controller';
import { PayrollConfigurationService } from './payroll-configuration.service';
import { CompanyWideSettings, CompanyWideSettingsSchema } from './models/CompanyWideSettings.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { allowance, allowanceSchema } from './models/allowance.schema';
import { insuranceBrackets, insuranceBracketsSchema } from './models/insuranceBrackets.schema';
import { payrollPolicies, payrollPoliciesSchema } from './models/payrollPolicies.schema';
import { payType, payTypeSchema } from './models/payType.schema';
import { signingBonus, signingBonusSchema } from './models/signingBonus.schema';
import { taxRules, taxRulesSchema } from './models/taxRules.schema';
import { terminationAndResignationBenefits, terminationAndResignationBenefitsSchema } from './models/terminationAndResignationBenefits';
import { payGrade } from './models/payGrades.schema';
import { TaxRulesService } from './services/tax-rules.service';
import { TaxRulesController } from './controllers/tax-rules.controller';
import { InsuranceBracketsService } from './services/insurance-brackets.service';
import { InsuranceBracketsController } from './controllers/insurance-brackets.controller';
import { CompanyWideSettingsService } from './services/company-wide-settings.service';
import { CompanyWideSettingsController } from './controllers/company-wide-settings.controller';
import { BackupService } from './services/backup.service';
import { BackupController } from './controllers/backup.controller';
import { ConfigurationApprovalService } from './services/configuration-approval.service';
import { ConfigurationApprovalsController } from './controllers/configuration-approvals.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: allowance.name, schema: allowanceSchema },
      { name: signingBonus.name, schema: signingBonusSchema },
      { name: taxRules.name, schema: taxRulesSchema },
      { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
      { name: payType.name, schema: payTypeSchema },
      { name: payrollPolicies.name, schema: payrollPoliciesSchema },
      { name: terminationAndResignationBenefits.name, schema: terminationAndResignationBenefitsSchema },
      { name: CompanyWideSettings.name, schema: CompanyWideSettingsSchema },
      { name: payGrade.name, schema: payTypeSchema }
    ]),
  ],
  controllers: [PayrollConfigurationController, TaxRulesController, InsuranceBracketsController, CompanyWideSettingsController, BackupController, ConfigurationApprovalsController],
  providers: [PayrollConfigurationService, TaxRulesService, InsuranceBracketsService, CompanyWideSettingsService, BackupService, ConfigurationApprovalService],
  exports:[PayrollConfigurationService, TaxRulesService, InsuranceBracketsService, CompanyWideSettingsService, BackupService, ConfigurationApprovalService]
})
export class PayrollConfigurationModule { }
