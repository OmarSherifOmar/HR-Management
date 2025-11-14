import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TerminationBenefit,
  TerminationBenefitSchema,
} from '../../models/payroll-execution/termination-benefit.entity';

const terminationBenefitModel = MongooseModule.forFeature([
  { name: TerminationBenefit.name, schema: TerminationBenefitSchema },
]);

@Module({
  imports: [terminationBenefitModel],
  exports: [terminationBenefitModel],
})
export class TerminationBenefitModule {}
