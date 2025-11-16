import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LegalRule, LegalRuleSchema } from '../models/payroll-models/LegalRule.Schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LegalRule.name, schema: LegalRuleSchema },
    ]),
  ],
})
export class LegalRuleModule {}
