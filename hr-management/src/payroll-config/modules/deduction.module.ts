import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Deduction, DeductionSchema } from '../models/deduction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deduction.name, schema: DeductionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DeductionModule {}
 