import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SeparationBenefit,
  SeparationBenefitSchema,
} from '../models/separation-benefit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeparationBenefit.name, schema: SeparationBenefitSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SeparationBenefitModule {}
 