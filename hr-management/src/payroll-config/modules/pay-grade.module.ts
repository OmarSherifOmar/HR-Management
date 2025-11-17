import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayGrade, PayGradeSchema } from '../models/pay-grade.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayGrade.name, schema: PayGradeSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class PayGradeModule {} 
