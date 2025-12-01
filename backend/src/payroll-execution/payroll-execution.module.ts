import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollExecutionController } from './payroll-execution.controller';
import { PayrollExecutionService } from './payroll-execution.service';
import { EmployeeSigningBonusController } from './controllers/employee-signing-bonus.controller';
import { EmployeeSigningBonusService } from './services/employee-signing-bonus.service';
import { EmployeeTerminationResignationController } from './controllers/employee-termination-resignation.controller';
import { EmployeeTerminationResignationService } from './services/employee-termination-resignation.service';
import { PayrollInitiationController } from './controllers/payroll-initiation.controller';
import { PayrollInitiationService } from './services/payroll-initiation.service';
import { terminationAndResignationBenefits, terminationAndResignationBenefitsSchema } from '../payroll-configuration/models/terminationAndResignationBenefits';
import { employeePayrollDetails, employeePayrollDetailsSchema } from './models/employeePayrollDetails.schema';
import { employeePenalties, employeePenaltiesSchema } from './models/employeePenalties.schema';
import { employeeSigningBonus, employeeSigningBonusSchema } from './models/EmployeeSigningBonus.schema';
import { EmployeeTerminationResignation, EmployeeTerminationResignationSchema } from './models/EmployeeTerminationResignation.schema';
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
    { name: EmployeeTerminationResignation.name, schema: EmployeeTerminationResignationSchema },

  ])],
  controllers: [
    PayrollExecutionController,
    EmployeeSigningBonusController,
    EmployeeTerminationResignationController,
    PayrollInitiationController,
  ],
  providers: [
    PayrollExecutionService,
    EmployeeSigningBonusService,
    EmployeeTerminationResignationService,
    PayrollInitiationService,
  ],
  exports: [
    PayrollExecutionService,
    EmployeeSigningBonusService,
    EmployeeTerminationResignationService,
    PayrollInitiationService,
  ]
})
export class PayrollExecutionModule { }
