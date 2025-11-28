"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollExecutionModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const payroll_execution_controller_1 = require("./payroll-execution.controller");
const payroll_execution_service_1 = require("./payroll-execution.service");
const terminationAndResignationBenefits_1 = require("../payroll-configuration/models/terminationAndResignationBenefits");
const employeePayrollDetails_schema_1 = require("./models/employeePayrollDetails.schema");
const employeePenalties_schema_1 = require("./models/employeePenalties.schema");
const EmployeeSigningBonus_schema_1 = require("./models/EmployeeSigningBonus.schema");
const payrollRuns_schema_1 = require("./models/payrollRuns.schema");
const payslip_schema_1 = require("./models/payslip.schema");
const payroll_tracking_module_1 = require("../payroll-tracking/payroll-tracking.module");
const payroll_configuration_module_1 = require("../payroll-configuration/payroll-configuration.module");
const time_management_module_1 = require("../time-management/time-management.module");
const employee_profile_module_1 = require("../employee-profile/employee-profile.module");
const leaves_module_1 = require("../leaves/leaves.module");
let PayrollExecutionModule = class PayrollExecutionModule {
};
exports.PayrollExecutionModule = PayrollExecutionModule;
exports.PayrollExecutionModule = PayrollExecutionModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => payroll_tracking_module_1.PayrollTrackingModule), payroll_configuration_module_1.PayrollConfigurationModule, time_management_module_1.TimeManagementModule, employee_profile_module_1.EmployeeProfileModule, leaves_module_1.LeavesModule,
            mongoose_1.MongooseModule.forFeature([
                { name: payrollRuns_schema_1.payrollRuns.name, schema: payrollRuns_schema_1.payrollRunsSchema },
                { name: payslip_schema_1.paySlip.name, schema: payslip_schema_1.paySlipSchema },
                { name: employeePayrollDetails_schema_1.employeePayrollDetails.name, schema: employeePayrollDetails_schema_1.employeePayrollDetailsSchema },
                { name: EmployeeSigningBonus_schema_1.employeeSigningBonus.name, schema: EmployeeSigningBonus_schema_1.employeeSigningBonusSchema },
                { name: terminationAndResignationBenefits_1.terminationAndResignationBenefits.name, schema: terminationAndResignationBenefits_1.terminationAndResignationBenefitsSchema },
                { name: employeePenalties_schema_1.employeePenalties.name, schema: employeePenalties_schema_1.employeePenaltiesSchema },
            ])],
        controllers: [payroll_execution_controller_1.PayrollExecutionController],
        providers: [payroll_execution_service_1.PayrollExecutionService],
        exports: [payroll_execution_service_1.PayrollExecutionService]
    })
], PayrollExecutionModule);
//# sourceMappingURL=payroll-execution.module.js.map