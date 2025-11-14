import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LegalDeductionRule, LegalDeductionRuleSchema } from '../models/payroll-models/LegalDeductionRule.Schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LegalDeductionRule.name, schema: LegalDeductionRuleSchema },
    ]),
  ],
})
export class LegalDeductionRuleModule {}
