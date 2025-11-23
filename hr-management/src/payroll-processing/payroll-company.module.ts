import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollCompany, PayrollCompanySchema } from './models/payroll-comapny.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayrollCompany.name, schema: PayrollCompanySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class PayrollCompanyModule {}
