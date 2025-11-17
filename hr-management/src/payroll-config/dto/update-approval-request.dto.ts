import { ApprovalStatus } from '../models/approval-request.schema';

export class UpdateApprovalRequestDto {
  status?: ApprovalStatus;
  decisionBy?: string;
  decisionAt?: Date;
  decisionNote?: string;
} 
