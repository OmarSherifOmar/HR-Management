import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackupPolicy, BackupPolicySchema } from '../models/backup-policy.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BackupPolicy.name, schema: BackupPolicySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class BackupPolicyModule {}
