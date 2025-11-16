import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OffboardingController } from '../controllers/offboarding.controller';
import { OffboardingService } from '../services/offboarding.service';
import { OffboardingRequest, OffboardingRequestSchema } from '../schemas/offboarding-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OffboardingRequest.name, schema: OffboardingRequestSchema },
    ]),
  ],
  controllers: [OffboardingController],
  providers: [OffboardingService],
  exports: [OffboardingService],
})
export class OffboardingModule {}

