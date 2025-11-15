import { Module } from '@nestjs/common';
import { LeaveTypeModule } from './modules/leave-type.module';
import { EntitlementModule } from './modules/entitlement.module';
import { CalendarModule } from './modules/calendar.module';
import { ApprovalWorkflowModule } from './modules/approval-workflow.module';
import { LeaveRequestModule } from './modules/leave-request.module';
import { DelegationModule } from './modules/delegation.module';
import { LeaveAttachmentModule } from './modules/leave-attachment.module';
import { LeaveBalanceTransactionModule } from './modules/leave-balance-transaction.module';
import { LeaveValidationLogModule } from './modules/leave-validation-log.module';

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
export class LeavesModule {}
