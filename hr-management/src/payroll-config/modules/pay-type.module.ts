import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayType, PayTypeSchema } from '../models/pay-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayType.name, schema: PayTypeSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class PayTypeModule {} 
