import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChangeRequest, ChangeRequestSchema } from './models/change-request.schema';
import { ChangeRequestService } from './change-request.service';
import { ChangeRequestController } from './change-request.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChangeRequest.name, schema: ChangeRequestSchema },
    ]),
  ],
  controllers: [ChangeRequestController],
  providers: [ChangeRequestService],
  exports: [ChangeRequestService],
})
export class ChangeRequestModule {}
