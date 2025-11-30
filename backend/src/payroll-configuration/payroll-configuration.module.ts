import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyWideSettings, CompanyWideSettingsSchema } from './models/CompanyWideSettings.schema';
import { allowance, allowanceSchema } from './models/allowance.schema';
import { insuranceBrackets, insuranceBracketsSchema } from './models/insuranceBrackets.schema';
import { payrollPolicies, payrollPoliciesSchema } from './models/payrollPolicies.schema';
import { payType, payTypeSchema } from './models/payType.schema';
import { signingBonus, signingBonusSchema } from './models/signingBonus.schema';
import { taxRules, taxRulesSchema } from './models/taxRules.schema';
import { terminationAndResignationBenefits, terminationAndResignationBenefitsSchema } from './models/terminationAndResignationBenefits';
import { payGrade } from './models/payGrades.schema';
import { PayrollPoliciesController } from './controllers/payroll-policies.controller';
import { PayrollPoliciesService } from './services/payroll-policies.service';
import { SigningBonusesController } from './controllers/signing-bonuses.controller';
import { SigningBonusesService } from './services/signing-bonuses.service';
import { TerminationBenefitsController } from './controllers/termination-benefits.controller';
import { TerminationBenefitsService } from './services/termination-benefits.service';

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
  controllers: [PayrollPoliciesController, SigningBonusesController, TerminationBenefitsController],
  providers: [PayrollPoliciesService, SigningBonusesService, TerminationBenefitsService],
  exports:[PayrollPoliciesService, SigningBonusesService, TerminationBenefitsService]
})
export class PayrollConfigurationModule { }
