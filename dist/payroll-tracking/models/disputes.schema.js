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
exports.disputesSchema = exports.disputes = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const employee_profile_schema_1 = require("../../employee-profile/models/employee-profile.schema");
const payroll_tracking_enum_1 = require("../enums/payroll-tracking-enum");
let disputes = class disputes {
    disputeId;
    description;
    employeeId;
    financeStaffId;
    payslipId;
    status;
    rejectionReason;
    resolutionComment;
};
exports.disputes = disputes;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], disputes.prototype, "disputeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], disputes.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name, required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], disputes.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], disputes.prototype, "financeStaffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'paySlip', required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], disputes.prototype, "payslipId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: payroll_tracking_enum_1.DisputeStatus, default: payroll_tracking_enum_1.DisputeStatus.UNDER_REVIEW }),
    __metadata("design:type", String)
], disputes.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], disputes.prototype, "rejectionReason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], disputes.prototype, "resolutionComment", void 0);
exports.disputes = disputes = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], disputes);
exports.disputesSchema = mongoose_1.SchemaFactory.createForClass(disputes);
//# sourceMappingURL=disputes.schema.js.map