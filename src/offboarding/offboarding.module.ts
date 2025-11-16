import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OffboardingController } from './offboarding.controller';
import { OffboardingService } from './offboarding.service';
import { OffboardingRequest, OffboardingRequestSchema } from './models/offboarding-request.schema';

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

