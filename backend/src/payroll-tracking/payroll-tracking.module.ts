// backend/src/payroll-tracking/payroll-tracking.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';
import { claims, claimsSchema, claimsDocument } from './models/claims.schema';
import { disputes, disputesSchema, disputesDocument } from './models/disputes.schema';
import { refunds, refundsSchema, refundsDocument } from './models/refunds.schema';
import { paySlip, paySlipSchema, PayslipDocument } from '../payroll-execution/models/payslip.schema';

import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';

import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { allowance, allowanceSchema } from '../payroll-configuration/models/allowance.schema';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';

@Module({
  imports: [
    // Ahmed branch modules
    PayrollConfigurationModule,
    forwardRef(() => PayrollExecutionModule),

    MongooseModule.forFeature([
      // claims
      { name: claims.name, schema: claimsSchema },

      // disputes
      { name: disputes.name, schema: disputesSchema },

      // refunds (only Omar branch had this here — keep it)
      { name: refunds.name, schema: refundsSchema },

      // payslip
      { name: paySlip.name, schema: paySlipSchema },

      // employee profile 
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      // allowance (needed by PayrollTrackingService)
      { name: allowance.name, schema: allowanceSchema },
    ]),
  ],
  controllers: [PayrollTrackingController],
  providers: [PayrollTrackingService],
  exports: [PayrollTrackingService],
})
export class PayrollTrackingModule {}
