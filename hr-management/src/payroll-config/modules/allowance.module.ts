import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Allowance, AllowanceSchema } from '../models/allowance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Allowance.name, schema: AllowanceSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class AllowanceModule {} 
