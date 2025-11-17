import { BackupPolicyStatus } from '../models/backup-policy.schema';

export class UpdateBackupPolicyDto {
  frequency?: string;
  retentionDays?: number;
  status?: BackupPolicyStatus;
  updatedBy?: string;
}
