import { DraftStatus } from '../models/config-draft.schema';

export class UpdateConfigDraftDto {
  status?: DraftStatus;
  changeSet?: Record<string, any>;
  decisionBy?: string;
  decisionAt?: Date;
  decisionNote?: string;
}