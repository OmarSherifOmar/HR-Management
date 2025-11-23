import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollException, PayrollExceptionSchema } from './models/payroll-exception.schema';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';
import { PayrollRunModule } from './run.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayrollException.name, schema: PayrollExceptionSchema },
    ]),
    EmployeeModule,
    forwardRef(() => PayrollRunModule),
  ],
  exports: [MongooseModule],
})
export class PayrollExceptionModule {}
