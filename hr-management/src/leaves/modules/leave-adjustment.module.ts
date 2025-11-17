import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveAdjustment, LeaveAdjustmentSchema } from '../models/leave-adjustment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveAdjustment.name, schema: LeaveAdjustmentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class LeaveAdjustmentModule {}
