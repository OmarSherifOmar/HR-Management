import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ApprovalRequest,
  ApprovalRequestSchema,
} from '../models/approval-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ApprovalRequestModule {}
 