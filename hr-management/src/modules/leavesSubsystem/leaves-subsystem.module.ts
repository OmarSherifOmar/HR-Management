import { Module } from '@nestjs/common';
import { LeaveTypeModule } from './leave-type.module';
import { EntitlementModule } from './entitlement.module';
import { CalendarModule } from './calendar.module';
import { ApprovalWorkflowModule } from './approval-workflow.module';

@Module({
  imports: [
    LeaveTypeModule,
    EntitlementModule,
    CalendarModule,
    ApprovalWorkflowModule,
  ],
  exports: [
    LeaveTypeModule,
    EntitlementModule,
    CalendarModule,
    ApprovalWorkflowModule,
  ],
})
export class LeavesSubsystemModule {}
