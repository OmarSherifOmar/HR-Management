import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveValidationLog, LeaveValidationLogSchema } from '../models/leave-validation-log.schema';
import { LeaveRequestModule } from './leave-request.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveValidationLog.name, schema: LeaveValidationLogSchema },
    ]),
    LeaveRequestModule,
  ],
  exports: [MongooseModule],
})
export class LeaveValidationLogModule {}
