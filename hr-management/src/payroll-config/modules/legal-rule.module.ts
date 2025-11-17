import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LegalRule, LegalRuleSchema } from '../models/legal-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LegalRule.name, schema: LegalRuleSchema }])
  ],
})
export class LegalRuleModule {}
