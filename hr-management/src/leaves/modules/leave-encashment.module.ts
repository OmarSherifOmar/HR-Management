import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveEncashment, LeaveEncashmentSchema } from '../models/leave-encashment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveEncashment.name, schema: LeaveEncashmentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class LeaveEncashmentModule {}
