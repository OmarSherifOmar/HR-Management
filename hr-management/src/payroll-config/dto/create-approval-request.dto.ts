import { ApprovalRole } from '../models/approval-request.schema';

export class CreateApprovalRequestDto {
  draftId: string;
  requestedForRole: ApprovalRole;
}
