import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveType, LeaveTypeSchema } from '../../models/leavesSubsystem/leave-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveType.name, schema: LeaveTypeSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class LeaveTypeModule {}
