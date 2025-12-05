import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollConfigurationController } from './payroll-configuration.controller';
import { CompanyWideSettings, CompanyWideSettingsSchema } from './models/CompanyWideSettings.schema';
import { allowance, allowanceSchema } from './models/allowance.schema';
import { insuranceBrackets, insuranceBracketsSchema } from './models/insuranceBrackets.schema';
import { payrollPolicies, payrollPoliciesSchema } from './models/payrollPolicies.schema';
import { payType, payTypeSchema } from './models/payType.schema';
import { signingBonus, signingBonusSchema } from './models/signingBonus.schema';
import { taxRules, taxRulesSchema } from './models/taxRules.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsSchema,
} from './models/terminationAndResignationBenefits';
import { payGrade, payGradeSchema } from './models/payGrades.schema';
import { PayrollPoliciesController } from './controllers/payroll-policies.controller';
import { PayrollPoliciesService } from './services/payroll-policies.service';
import { SigningBonusesController } from './controllers/signing-bonuses.controller';
import { SigningBonusesService } from './services/signing-bonuses.service';
import { TerminationBenefitsController } from './controllers/termination-benefits.controller';
import { TerminationBenefitsService } from './services/termination-benefits.service';
import { AllowancesController } from './controllers/allowances.controller';
import { AllowancesService } from './services/allowances.service';
import { PayTypesController } from './controllers/pay-types.controller';
import { PayTypesService } from './services/pay-types.service';
import { PayGradesController } from './controllers/pay-grades.controller';
import { PayGradesService } from './services/pay-grades.service';
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
      {
        name: terminationAndResignationBenefits.name,
        schema: terminationAndResignationBenefitsSchema,
      },
      { name: CompanyWideSettings.name, schema: CompanyWideSettingsSchema },
      { name: payGrade.name, schema: payGradeSchema },
    ]),
  ],
  controllers: [TaxRulesController, InsuranceBracketsController, CompanyWideSettingsController, BackupController, ConfigurationApprovalsController,  AllowancesController,
    PayTypesController,
    PayGradesController,PayrollPoliciesController, SigningBonusesController, TerminationBenefitsController],
  providers: [TaxRulesService, InsuranceBracketsService, CompanyWideSettingsService, BackupService, ConfigurationApprovalService, AllowancesService,
    PayTypesService,
    PayGradesService,PayrollPoliciesService, SigningBonusesService, TerminationBenefitsService],
  exports:[
    // re-export the allowance model provider so other modules can inject allowanceModel via @InjectModel
    MongooseModule.forFeature([{ name: allowance.name, schema: allowanceSchema }]),
    TaxRulesService,
    InsuranceBracketsService,
    CompanyWideSettingsService,
    BackupService,
    ConfigurationApprovalService,
    AllowancesService,
    PayTypesService,
    PayGradesService,PayrollPoliciesService, SigningBonusesService, TerminationBenefitsService]





  
 
})
export class PayrollConfigurationModule {}