import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SigningBonus,
  SigningBonusSchema,
} from '../../models/payroll-execution/signing-bonus.entity';

const signingBonusModel = MongooseModule.forFeature([
  { name: SigningBonus.name, schema: SigningBonusSchema },
]);

@Module({
  imports: [signingBonusModel],
  exports: [signingBonusModel],
})
export class SigningBonusModule {}
