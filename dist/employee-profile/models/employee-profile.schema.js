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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeProfileSchema = exports.EmployeeProfile = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const employee_profile_enums_1 = require("../enums/employee-profile.enums");
const performance_enums_1 = require("../../performance/enums/performance.enums");
const payGrades_schema_1 = require("../../payroll-configuration/models/payGrades.schema");
const user_schema_1 = require("./user-schema");
let EmployeeProfile = class EmployeeProfile extends user_schema_1.UserProfileBase {
    employeeNumber;
    dateOfHire;
    workEmail;
    biography;
    contractStartDate;
    contractEndDate;
    contractType;
    workType;
    status;
    statusEffectiveFrom;
    primaryPositionId;
    primaryDepartmentId;
    supervisorPositionId;
    payGradeId;
    lastAppraisalRecordId;
    lastAppraisalCycleId;
    lastAppraisalTemplateId;
    lastAppraisalDate;
    lastAppraisalScore;
    lastAppraisalRatingLabel;
    lastAppraisalScaleType;
    lastDevelopmentPlanSummary;
};
exports.EmployeeProfile = EmployeeProfile;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "employeeNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], EmployeeProfile.prototype, "dateOfHire", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "workEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "biography", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], EmployeeProfile.prototype, "contractStartDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], EmployeeProfile.prototype, "contractEndDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(employee_profile_enums_1.ContractType),
        required: false,
    }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "contractType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(employee_profile_enums_1.WorkType),
        required: false,
    }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "workType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(employee_profile_enums_1.EmployeeStatus),
        required: true,
        default: employee_profile_enums_1.EmployeeStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], EmployeeProfile.prototype, "statusEffectiveFrom", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Position' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeProfile.prototype, "primaryPositionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Department' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeProfile.prototype, "primaryDepartmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Position' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeProfile.prototype, "supervisorPositionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: payGrades_schema_1.payGrade.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeProfile.prototype, "payGradeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalRecord' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeProfile.prototype, "lastAppraisalRecordId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalCycle' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeProfile.prototype, "lastAppraisalCycleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalTemplate' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeProfile.prototype, "lastAppraisalTemplateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], EmployeeProfile.prototype, "lastAppraisalDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], EmployeeProfile.prototype, "lastAppraisalScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "lastAppraisalRatingLabel", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(performance_enums_1.AppraisalRatingScaleType),
    }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "lastAppraisalScaleType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], EmployeeProfile.prototype, "lastDevelopmentPlanSummary", void 0);
exports.EmployeeProfile = EmployeeProfile = __decorate([
    (0, mongoose_1.Schema)({ collection: 'employee_profiles', timestamps: true })
], EmployeeProfile);
exports.EmployeeProfileSchema = mongoose_1.SchemaFactory.createForClass(EmployeeProfile);
//# sourceMappingURL=employee-profile.schema.js.map