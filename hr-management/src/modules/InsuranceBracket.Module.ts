import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InsuranceBracket, InsuranceBracketSchema } from '../models/payroll-models/InsuranceBracket.Schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InsuranceBracket.name, schema: InsuranceBracketSchema },
    ]),
  ],
})
export class InsuranceBracketModule {}
