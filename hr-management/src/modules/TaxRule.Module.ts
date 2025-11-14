// tax-rule.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxRule, TaxRuleSchema } from '../models/payroll-models/TaxRule.Schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TaxRule.name, schema: TaxRuleSchema }]),
  ],
})
export class TaxRuleModule {}
