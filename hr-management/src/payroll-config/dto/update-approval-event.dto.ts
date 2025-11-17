import { ApprovalAction } from '../models/approval-event.schema';

export class UpdateApprovalEventDto {
  action?: ApprovalAction;
  at?: Date;
  note?: string;
}