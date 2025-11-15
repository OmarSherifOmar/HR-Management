import { Module } from '@nestjs/common';
import { LeaveTypeModule } from './leave-type.module';
import { EntitlementModule } from './entitlement.module';
import { CalendarModule } from './calendar.module';
import { ApprovalWorkflowModule } from './approval-workflow.module';
import { LeaveRequestModule } from './leave-request.module';
import { DelegationModule } from './delegation.module';
import { LeaveAttachmentModule } from './leave-attachment.module';
import { LeaveBalanceTransactionModule } from './leave-balance-transaction.module';
import { LeaveValidationLogModule } from './leave-validation-log.module';

@Module({
  imports: [
    LeaveTypeModule,
    EntitlementModule,
    CalendarModule,
    ApprovalWorkflowModule,
    LeaveRequestModule,
    DelegationModule,
    LeaveAttachmentModule,
    LeaveBalanceTransactionModule,
    LeaveValidationLogModule,
  ],
  exports: [
    LeaveTypeModule,
    EntitlementModule,
    CalendarModule,
    ApprovalWorkflowModule,
    LeaveRequestModule,
    DelegationModule,
    LeaveAttachmentModule,
    LeaveBalanceTransactionModule,
    LeaveValidationLogModule,
  ],
})
export class LeavesSubsystemModule {}
