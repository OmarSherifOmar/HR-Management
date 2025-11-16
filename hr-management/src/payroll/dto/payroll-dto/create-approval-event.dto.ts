export type ApprovalAction =
  | 'SUBMIT'
  | 'REQUESTED'
  | 'APPROVE'
  | 'REJECT'
  | 'CANCEL';

export class CreateApprovalEventDto {
  draftId: string;
  actorId: string;
  action: ApprovalAction;
  at?: Date;   // optional: backend can set it to now()
  note?: string;
}
