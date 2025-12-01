import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleRuleController } from '../controllers/schedule-rule.controller';
import { ScheduleRuleService } from '../services/schedule-rule.service';
import { ScheduleRule, ScheduleRuleSchema } from '../models/schedule-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ScheduleRule.name, schema: ScheduleRuleSchema }])
  ],
  controllers: [ScheduleRuleController],
  providers: [ScheduleRuleService],
  exports: [ScheduleRuleService]
})
export class ScheduleRuleModule {}
