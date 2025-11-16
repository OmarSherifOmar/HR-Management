import type { ApprovalRole } from './create-approval-request.dto';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class UpdateApprovalRequestDto {
  requestedForRole?: ApprovalRole;
  status?: ApprovalStatus;
  decisionBy?: string;
  decisionAt?: Date;
  decisionNote?: string;
}
