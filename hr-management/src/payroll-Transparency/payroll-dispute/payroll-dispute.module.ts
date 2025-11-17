import { Module } from '@nestjs/common';
import { PayrollDisputeService } from './payroll-dispute.service';
import { PayrollDisputeController } from './payroll-dispute.controller';

@Module({
  controllers: [PayrollDisputeController],
  providers: [PayrollDisputeService],
})
export class PayrollDisputeModule {}
