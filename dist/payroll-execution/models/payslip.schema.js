"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paySlipSchema = exports.paySlip = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const allowance_schema_1 = require("../../payroll-configuration/models/allowance.schema");
const signingBonus_schema_1 = require("../../payroll-configuration/models/signingBonus.schema");
const terminationAndResignationBenefits_1 = require("../../payroll-configuration/models/terminationAndResignationBenefits");
const taxRules_schema_1 = require("../../payroll-configuration/models/taxRules.schema");
const insuranceBrackets_schema_1 = require("../../payroll-configuration/models/insuranceBrackets.schema");
const employeePenalties_schema_1 = require("./employeePenalties.schema");
const employee_profile_schema_1 = require("../../employee-profile/models/employee-profile.schema");
const refunds_schema_1 = require("../../payroll-tracking/models/refunds.schema");
const payrollRuns_schema_1 = require("./payrollRuns.schema");
const payroll_execution_enum_1 = require("../enums/payroll-execution-enum");
let Earnings = class Earnings {
    baseSalary;
    allowances;
    bonuses;
    benefits;
    refunds;
};
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Earnings.prototype, "baseSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [allowance_schema_1.allowanceSchema] }),
    __metadata("design:type", Array)
], Earnings.prototype, "allowances", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [signingBonus_schema_1.signingBonusSchema] }),
    __metadata("design:type", Array)
], Earnings.prototype, "bonuses", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [terminationAndResignationBenefits_1.terminationAndResignationBenefitsSchema] }),
    __metadata("design:type", Array)
], Earnings.prototype, "benefits", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [refunds_schema_1.refundDetailsSchema] }),
    __metadata("design:type", Array)
], Earnings.prototype, "refunds", void 0);
Earnings = __decorate([
    (0, mongoose_1.Schema)()
], Earnings);
const EarningsSchema = mongoose_1.SchemaFactory.createForClass(Earnings);
let Deductions = class Deductions {
    taxes;
    insurances;
    penalties;
};
__decorate([
    (0, mongoose_1.Prop)({ type: [taxRules_schema_1.taxRulesSchema] }),
    __metadata("design:type", Array)
], Deductions.prototype, "taxes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [insuranceBrackets_schema_1.insuranceBracketsSchema] }),
    __metadata("design:type", Array)
], Deductions.prototype, "insurances", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: employeePenalties_schema_1.employeePenaltiesSchema }),
    __metadata("design:type", employeePenalties_schema_1.employeePenalties)
], Deductions.prototype, "penalties", void 0);
Deductions = __decorate([
    (0, mongoose_1.Schema)()
], Deductions);
const DeductionsSchema = mongoose_1.SchemaFactory.createForClass(Deductions);
let paySlip = class paySlip {
    employeeId;
    payrollRunId;
    earningsDetails;
    deductionsDetails;
    totalGrossSalary;
    totaDeductions;
    netPay;
    paymentStatus;
};
exports.paySlip = paySlip;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], paySlip.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.ObjectId, ref: payrollRuns_schema_1.payrollRuns.name, required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], paySlip.prototype, "payrollRunId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: EarningsSchema }),
    __metadata("design:type", Earnings)
], paySlip.prototype, "earningsDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: DeductionsSchema }),
    __metadata("design:type", Deductions)
], paySlip.prototype, "deductionsDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], paySlip.prototype, "totalGrossSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], paySlip.prototype, "totaDeductions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], paySlip.prototype, "netPay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: payroll_execution_enum_1.PaySlipPaymentStatus, default: payroll_execution_enum_1.PaySlipPaymentStatus.PENDING }),
    __metadata("design:type", String)
], paySlip.prototype, "paymentStatus", void 0);
exports.paySlip = paySlip = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], paySlip);
exports.paySlipSchema = mongoose_1.SchemaFactory.createForClass(paySlip);
//# sourceMappingURL=payslip.schema.js.map