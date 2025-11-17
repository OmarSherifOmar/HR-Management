import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveBalanceTransaction, LeaveBalanceTransactionSchema } from '../models/leave-balance-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveBalanceTransaction.name, schema: LeaveBalanceTransactionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class LeaveBalanceTransactionModule {}
