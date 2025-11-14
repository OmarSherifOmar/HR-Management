import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EntitlementRule, EntitlementRuleSchema } from '../../models/leavesSubsystem/entitlement-rule.schema';
import { EmployeeEntitlement, EmployeeEntitlementSchema } from '../../models/leavesSubsystem/employee-entitlement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntitlementRule.name, schema: EntitlementRuleSchema },
      { name: EmployeeEntitlement.name, schema: EmployeeEntitlementSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class EntitlementModule {}
