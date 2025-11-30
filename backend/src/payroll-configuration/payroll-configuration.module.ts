import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

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

import { AllowancesController } from './controllers/allowances.controller';
import { AllowancesService } from './services/allowances.service';
import { PayTypesController } from './controllers/pay-types.controller';
import { PayTypesService } from './services/pay-types.service';
import { PayGradesController } from './controllers/pay-grades.controller';
import { PayGradesService } from './services/pay-grades.service';

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
  controllers: [
    AllowancesController,
    PayTypesController,
    PayGradesController,
  ],
  
  providers: [
    AllowancesService,
    PayTypesService,
    PayGradesService,
  ],
  
  exports: [
    AllowancesService,
    PayTypesService,
    PayGradesService,
  ],
  
})
export class PayrollConfigurationModule {}
