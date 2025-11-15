import type { DraftOp } from './create-config-draft.dto';

export type DraftStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export class UpdateConfigDraftDto {
  // Normally you don't change op, but we keep it optional here in case
  op?: DraftOp;
  status?: DraftStatus;
  changeSet?: Record<string, any>;
  decisionBy?: string;
  decisionAt?: Date;
  decisionNote?: string;
}
