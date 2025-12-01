// backend/src/payroll-tracking/payroll-tracking.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';

// payroll-tracking schema imports — adjust names if your files export different symbols
import { claims, claimsSchema, claimsDocument } from './models/claims.schema';
import { disputes, disputesSchema, disputesDocument } from './models/disputes.schema';
import { refunds, refundsSchema, refundsDocument } from './models/refunds.schema';

// payslip from payroll-execution — keep your existing lowercase paySlip export
import { paySlip, paySlipSchema, PayslipDocument } from '../payroll-execution/models/payslip.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
      { name: refunds.name, schema: refundsSchema },

      // register payslip model under the name exported by your payslip class
      { name: paySlip.name, schema: paySlipSchema },
    ]),
  ],
  controllers: [PayrollTrackingController],
  providers: [PayrollTrackingService],
  exports: [PayrollTrackingService],
})
export class PayrollTrackingModule {}
