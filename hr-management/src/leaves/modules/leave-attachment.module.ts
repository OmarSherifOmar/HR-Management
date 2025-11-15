import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveAttachment, LeaveAttachmentSchema } from '../models/leave-attachment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveAttachment.name, schema: LeaveAttachmentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class LeaveAttachmentModule {}
