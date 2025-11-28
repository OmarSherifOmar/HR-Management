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
exports.LeaveAdjustmentSchema = exports.LeaveAdjustment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const adjustment_type_enum_1 = require("../enums/adjustment-type.enum");
let LeaveAdjustment = class LeaveAdjustment {
    employeeId;
    leaveTypeId;
    adjustmentType;
    amount;
    reason;
    hrUserId;
};
exports.LeaveAdjustment = LeaveAdjustment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Employee', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveAdjustment.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'LeaveType', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveAdjustment.prototype, "leaveTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: adjustment_type_enum_1.AdjustmentType, required: true }),
    __metadata("design:type", String)
], LeaveAdjustment.prototype, "adjustmentType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], LeaveAdjustment.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], LeaveAdjustment.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Employee', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveAdjustment.prototype, "hrUserId", void 0);
exports.LeaveAdjustment = LeaveAdjustment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], LeaveAdjustment);
exports.LeaveAdjustmentSchema = mongoose_1.SchemaFactory.createForClass(LeaveAdjustment);
//# sourceMappingURL=leave-adjustment.schema.js.map