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
exports.EmployeeTerminationResignationSchema = exports.EmployeeTerminationResignation = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const terminationAndResignationBenefits_1 = require("../../payroll-configuration/models/terminationAndResignationBenefits");
const employee_profile_schema_1 = require("../../employee-profile/models/employee-profile.schema");
const termination_request_schema_1 = require("../../recruitment/models/termination-request.schema");
const payroll_execution_enum_1 = require("../enums/payroll-execution-enum");
let EmployeeTerminationResignation = class EmployeeTerminationResignation {
    employeeId;
    benefitId;
    terminationId;
    status;
};
exports.EmployeeTerminationResignation = EmployeeTerminationResignation;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name, required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], EmployeeTerminationResignation.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: terminationAndResignationBenefits_1.terminationAndResignationBenefits.name, required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], EmployeeTerminationResignation.prototype, "benefitId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: termination_request_schema_1.TerminationRequest.name, required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], EmployeeTerminationResignation.prototype, "terminationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: payroll_execution_enum_1.BenefitStatus.PENDING, type: String, enum: payroll_execution_enum_1.BenefitStatus }),
    __metadata("design:type", String)
], EmployeeTerminationResignation.prototype, "status", void 0);
exports.EmployeeTerminationResignation = EmployeeTerminationResignation = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], EmployeeTerminationResignation);
exports.EmployeeTerminationResignationSchema = mongoose_1.SchemaFactory.createForClass(EmployeeTerminationResignation);
//# sourceMappingURL=EmployeeTerminationResignation.schema.js.map