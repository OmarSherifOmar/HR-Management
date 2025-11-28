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
exports.LeavePolicySchema = exports.LeavePolicy = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const accrual_method_enum_1 = require("../enums/accrual-method.enum");
const rounding_rule_enum_1 = require("../enums/rounding-rule.enum");
let LeavePolicy = class LeavePolicy {
    leaveTypeId;
    accrualMethod;
    monthlyRate;
    yearlyRate;
    carryForwardAllowed;
    maxCarryForward;
    expiryAfterMonths;
    roundingRule;
    minNoticeDays;
    maxConsecutiveDays;
    eligibility;
};
exports.LeavePolicy = LeavePolicy;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'LeaveType', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeavePolicy.prototype, "leaveTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: accrual_method_enum_1.AccrualMethod, default: accrual_method_enum_1.AccrualMethod.MONTHLY }),
    __metadata("design:type", String)
], LeavePolicy.prototype, "accrualMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeavePolicy.prototype, "monthlyRate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeavePolicy.prototype, "yearlyRate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], LeavePolicy.prototype, "carryForwardAllowed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeavePolicy.prototype, "maxCarryForward", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], LeavePolicy.prototype, "expiryAfterMonths", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: rounding_rule_enum_1.RoundingRule, default: rounding_rule_enum_1.RoundingRule.NONE }),
    __metadata("design:type", String)
], LeavePolicy.prototype, "roundingRule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeavePolicy.prototype, "minNoticeDays", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], LeavePolicy.prototype, "maxConsecutiveDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            minTenureMonths: Number,
            positionsAllowed: [String],
            contractTypesAllowed: [String],
        },
    }),
    __metadata("design:type", Object)
], LeavePolicy.prototype, "eligibility", void 0);
exports.LeavePolicy = LeavePolicy = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], LeavePolicy);
exports.LeavePolicySchema = mongoose_1.SchemaFactory.createForClass(LeavePolicy);
//# sourceMappingURL=leave-policy.schema.js.map