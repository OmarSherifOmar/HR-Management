import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollDispute, PayrollDisputeSchema } from '../models/payroll-dispute.schema';
import { PayrollDisputeService } from './payroll-dispute.service';
import { PayrollDisputeController } from './payroll-dispute.controller';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';
import { PayslipModule } from '../../payroll-processing/payslip.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayrollDispute.name, schema: PayrollDisputeSchema },
    ]),
    EmployeeModule,
    PayslipModule,
  ],
  providers: [PayrollDisputeService],
  controllers: [PayrollDisputeController],
  exports: [MongooseModule],
})
export class PayrollDisputeModule {}
