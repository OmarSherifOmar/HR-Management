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
exports.ShiftAssignmentSchema = exports.ShiftAssignment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const index_1 = require("./enums/index");
let ShiftAssignment = class ShiftAssignment {
    employeeId;
    departmentId;
    positionId;
    shiftId;
    scheduleRuleId;
    startDate;
    endDate;
    status;
};
exports.ShiftAssignment = ShiftAssignment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ShiftAssignment.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Department' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ShiftAssignment.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Position' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ShiftAssignment.prototype, "positionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Shift', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ShiftAssignment.prototype, "shiftId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'ScheduleRule' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ShiftAssignment.prototype, "scheduleRuleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], ShiftAssignment.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ShiftAssignment.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: index_1.ShiftAssignmentStatus, default: index_1.ShiftAssignmentStatus.PENDING }),
    __metadata("design:type", String)
], ShiftAssignment.prototype, "status", void 0);
exports.ShiftAssignment = ShiftAssignment = __decorate([
    (0, mongoose_1.Schema)()
], ShiftAssignment);
exports.ShiftAssignmentSchema = mongoose_1.SchemaFactory.createForClass(ShiftAssignment);
//# sourceMappingURL=shift-assignment.schema.js.map