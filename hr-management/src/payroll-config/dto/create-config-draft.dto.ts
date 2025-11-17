import { TargetType, DraftOp, DraftStatus } from '../models/config-draft.schema';

export class CreateConfigDraftDto {
  refCode?: string;
  targetType: TargetType;
  targetId?: string | null;
  op: DraftOp;
  changeSet: Record<string, any>;
  status: DraftStatus;
  submittedBy: string;
  submittedAt: Date;
}