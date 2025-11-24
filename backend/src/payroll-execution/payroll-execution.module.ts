import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollExecutionController } from './payroll-execution.controller';
import { PayrollExecutionService } from './payroll-execution.service';
import { terminationAndResignationBenefits, terminationAndResignationBenefitsSchema } from '../payroll-configuration/models/terminationAndResignationBenefits';
import { employeePayrollDetails, employeePayrollDetailsSchema } from './models/employeePayrollDetails.schema';
import { employeePenalties, employeePenaltiesSchema } from './models/employeePenalties.schema';
import { employeeSigningBonus, employeeSigningBonusSchema } from './models/EmployeeSigningBonus.schema';
import { payrollRuns, payrollRunsSchema } from './models/payrollRuns.schema';
import { paySlip, paySlipSchema } from './models/payslip.schema';
import { PayrollTrackingModule } from '../payroll-tracking/payroll-tracking.module';
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { TimeManagementModule } from '../time-management/time-management.module';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { LeavesModule } from '../leaves/leaves.module';

@Module({
  imports: [forwardRef(() => PayrollTrackingModule), PayrollConfigurationModule, TimeManagementModule, EmployeeProfileModule, LeavesModule,
  MongooseModule.forFeature([
    { name: payrollRuns.name, schema: payrollRunsSchema },
    { name: paySlip.name, schema: paySlipSchema },
    { name: employeePayrollDetails.name, schema: employeePayrollDetailsSchema },
    { name: employeeSigningBonus.name, schema: employeeSigningBonusSchema },
    { name: terminationAndResignationBenefits.name, schema: terminationAndResignationBenefitsSchema },
    { name: employeePenalties.name, schema: employeePenaltiesSchema },

  ])],
  controllers: [PayrollExecutionController],
  providers: [PayrollExecutionService],
  exports: [PayrollExecutionService]
})
export class PayrollExecutionModule { }
