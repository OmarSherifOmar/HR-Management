import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SeparationBenefit,
  SeparationBenefitSchema,
} from '../models/separation-benefit.schema';
import { OffboardingModule } from '../../recruitment/modules/offboarding.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeparationBenefit.name, schema: SeparationBenefitSchema },
    ]),
    OffboardingModule,
  ],
  exports: [MongooseModule],
})
export class SeparationBenefitModule {} 
