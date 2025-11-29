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
exports.payrollRunsSchema = exports.payrollRuns = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const employee_profile_schema_1 = require("../../employee-profile/models/employee-profile.schema");
const payroll_execution_enum_1 = require("../enums/payroll-execution-enum");
let payrollRuns = class payrollRuns {
    runId;
    payrollPeriod;
    status;
    entity;
    employees;
    exceptions;
    totalnetpay;
    payrollSpecialistId;
    paymentStatus;
    payrollManagerId;
    financeStaffId;
    rejectionReason;
    unlockReason;
    managerApprovalDate;
    financeApprovalDate;
};
exports.payrollRuns = payrollRuns;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], payrollRuns.prototype, "runId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], payrollRuns.prototype, "payrollPeriod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: payroll_execution_enum_1.PayRollStatus, default: payroll_execution_enum_1.PayRollStatus.DRAFT }),
    __metadata("design:type", String)
], payrollRuns.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], payrollRuns.prototype, "entity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], payrollRuns.prototype, "employees", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], payrollRuns.prototype, "exceptions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], payrollRuns.prototype, "totalnetpay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Schema.Types.ObjectId)
], payrollRuns.prototype, "payrollSpecialistId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: payroll_execution_enum_1.PayRollPaymentStatus, default: payroll_execution_enum_1.PayRollPaymentStatus.PENDING }),
    __metadata("design:type", String)
], payrollRuns.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Schema.Types.ObjectId)
], payrollRuns.prototype, "payrollManagerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Schema.Types.ObjectId)
], payrollRuns.prototype, "financeStaffId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], payrollRuns.prototype, "rejectionReason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], payrollRuns.prototype, "unlockReason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], payrollRuns.prototype, "managerApprovalDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], payrollRuns.prototype, "financeApprovalDate", void 0);
exports.payrollRuns = payrollRuns = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], payrollRuns);
exports.payrollRunsSchema = mongoose_1.SchemaFactory.createForClass(payrollRuns);
//# sourceMappingURL=payrollRuns.schema.js.map