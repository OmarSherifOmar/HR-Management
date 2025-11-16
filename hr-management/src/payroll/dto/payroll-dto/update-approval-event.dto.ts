import type { ApprovalAction } from './create-approval-event.dto';

export class UpdateApprovalEventDto {
  action?: ApprovalAction;
  at?: Date;
  note?: string;
}
