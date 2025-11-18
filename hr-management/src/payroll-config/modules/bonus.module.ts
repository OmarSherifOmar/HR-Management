import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bonus, BonusSchema } from '../models/bonus.schema';
import { OnboardingModule } from '../../recruitment/modules/onboarding.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bonus.name, schema: BonusSchema },
    ]),
    OnboardingModule,
  ],
  exports: [MongooseModule],
})
export class BonusModule {} 
