import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Onboarding, OnboardingSchema } from '../schemas/onboarding.schema';
import { OnboardingService } from '../services/onboarding.service';
import { OnboardingController } from '../controllers/onboarding.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Onboarding.name, schema: OnboardingSchema }]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}