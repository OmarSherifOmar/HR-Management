import { BackupFrequency } from '../models/backup-policy.schema';

export class CreateBackupPolicyDto {
  frequency: BackupFrequency;
  retentionDays: number;
  createdBy: string;
}
