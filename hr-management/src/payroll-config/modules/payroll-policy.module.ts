import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PayrollPolicy,
  PayrollPolicySchema,
} from '../models/payroll-policy.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayrollPolicy.name, schema: PayrollPolicySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class PayrollPolicyModule {} 
