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
exports.payrollPoliciesSchema = exports.payrollPolicies = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const employee_profile_schema_1 = require("../../employee-profile/models/employee-profile.schema");
const payroll_configuration_enums_1 = require("../enums/payroll-configuration-enums");
let RuleDefinition = class RuleDefinition {
    percentage;
    fixedAmount;
    thresholdAmount;
};
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 100 }),
    __metadata("design:type", Number)
], RuleDefinition.prototype, "percentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], RuleDefinition.prototype, "fixedAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], RuleDefinition.prototype, "thresholdAmount", void 0);
RuleDefinition = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RuleDefinition);
const RuleDefinitionSchema = mongoose_1.SchemaFactory.createForClass(RuleDefinition);
let payrollPolicies = class payrollPolicies {
    policyName;
    policyType;
    description;
    effectiveDate;
    ruleDefinition;
    applicability;
    status;
    createdBy;
    approvedBy;
    approvedAt;
};
exports.payrollPolicies = payrollPolicies;
__decorate([
    (0, mongoose_1.Prop)({ required: true, }),
    __metadata("design:type", String)
], payrollPolicies.prototype, "policyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: payroll_configuration_enums_1.PolicyType }),
    __metadata("design:type", String)
], payrollPolicies.prototype, "policyType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], payrollPolicies.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], payrollPolicies.prototype, "effectiveDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: RuleDefinitionSchema }),
    __metadata("design:type", RuleDefinition)
], payrollPolicies.prototype, "ruleDefinition", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: payroll_configuration_enums_1.Applicability, type: String }),
    __metadata("design:type", String)
], payrollPolicies.prototype, "applicability", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: payroll_configuration_enums_1.ConfigStatus, default: payroll_configuration_enums_1.ConfigStatus.DRAFT }),
    __metadata("design:type", String)
], payrollPolicies.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], payrollPolicies.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], payrollPolicies.prototype, "approvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({}),
    __metadata("design:type", Date)
], payrollPolicies.prototype, "approvedAt", void 0);
exports.payrollPolicies = payrollPolicies = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], payrollPolicies);
exports.payrollPoliciesSchema = mongoose_1.SchemaFactory.createForClass(payrollPolicies);
//# sourceMappingURL=payrollPolicies.schema.js.map