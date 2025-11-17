import {
  TargetType,
  DraftOp,
} from '../models/config-draft.schema';

export class CreateConfigDraftDto {
  refCode?: string;
  targetType: TargetType;
  targetId?: string | null;
  op: DraftOp;
  changeSet: Record<string, any>;
  submittedBy: string;
  submittedAt: Date;
}
 