import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveBalanceTransaction, LeaveBalanceTransactionSchema } from '../models/leave-balance-transaction.schema';
import { EntitlementModule } from './entitlement.module';
import { LeaveRequestModule } from './leave-request.module';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveBalanceTransaction.name, schema: LeaveBalanceTransactionSchema },
    ]),
    EntitlementModule,
    LeaveRequestModule,
    EmployeeModule,
  ],
  exports: [MongooseModule],
})
export class LeaveBalanceTransactionModule {}
