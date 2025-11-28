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
exports.LeaveEntitlementSchema = exports.LeaveEntitlement = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let LeaveEntitlement = class LeaveEntitlement {
    employeeId;
    leaveTypeId;
    yearlyEntitlement;
    accruedActual;
    accruedRounded;
    carryForward;
    taken;
    pending;
    remaining;
    lastAccrualDate;
    nextResetDate;
};
exports.LeaveEntitlement = LeaveEntitlement;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Employee', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveEntitlement.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'LeaveType', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveEntitlement.prototype, "leaveTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeaveEntitlement.prototype, "yearlyEntitlement", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeaveEntitlement.prototype, "accruedActual", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeaveEntitlement.prototype, "accruedRounded", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeaveEntitlement.prototype, "carryForward", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeaveEntitlement.prototype, "taken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeaveEntitlement.prototype, "pending", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LeaveEntitlement.prototype, "remaining", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], LeaveEntitlement.prototype, "lastAccrualDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], LeaveEntitlement.prototype, "nextResetDate", void 0);
exports.LeaveEntitlement = LeaveEntitlement = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], LeaveEntitlement);
exports.LeaveEntitlementSchema = mongoose_1.SchemaFactory.createForClass(LeaveEntitlement);
//# sourceMappingURL=leave-entitlement.schema.js.map