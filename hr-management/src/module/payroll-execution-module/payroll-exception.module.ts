import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PayrollException,
  PayrollExceptionSchema,
} from '../../models/payroll-execution/payroll-exception.entity';

const payrollExceptionModel = MongooseModule.forFeature([
  { name: PayrollException.name, schema: PayrollExceptionSchema },
]);

@Module({
  imports: [payrollExceptionModel],
  exports: [payrollExceptionModel],
})
export class PayrollExceptionModule {}
