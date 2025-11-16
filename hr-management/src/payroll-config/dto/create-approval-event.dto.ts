import { ApprovalAction } from '../models/approval-event.schema';

export class CreateApprovalEventDto {
  draftId: string;
  actorId: string;
  action: ApprovalAction;
  at: Date;
  note?: string;
}
