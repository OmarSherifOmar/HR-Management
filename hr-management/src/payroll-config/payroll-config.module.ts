import { Module } from '@nestjs/common';


import { LegalRuleModule } from './modules/legal-rule.module';
import { InsuranceBracketModule } from './modules/insurance-bracket.module';
import { TaxRuleModule } from './modules/tax-rule.module';

@Module({
  imports: [
    LegalRuleModule,
    InsuranceBracketModule,
    TaxRuleModule,
   
  ],
  exports: [
    LegalRuleModule,
    InsuranceBracketModule,
    TaxRuleModule,
  ],
})
export class PayrollConfigModule {}
    