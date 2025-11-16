export type ApprovalRole = 'PayrollManager' | 'SystemAdmin' | 'HRManager';

export class CreateApprovalRequestDto {
  draftId: string;
  requestedForRole: ApprovalRole;
}
