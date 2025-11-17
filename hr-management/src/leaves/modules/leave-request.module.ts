import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveRequest, LeaveRequestSchema } from '../models/leave-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class LeaveRequestModule {}
