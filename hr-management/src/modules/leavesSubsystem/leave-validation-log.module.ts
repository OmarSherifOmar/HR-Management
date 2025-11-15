import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveValidationLog, LeaveValidationLogSchema } from '../../models/leavesSubsystem/leave-validation-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveValidationLog.name, schema: LeaveValidationLogSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class LeaveValidationLogModule {}
