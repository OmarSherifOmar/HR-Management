import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ApprovalEvent,
  ApprovalEventSchema,
} from '../models/approval-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalEvent.name, schema: ApprovalEventSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ApprovalEventModule {}
 