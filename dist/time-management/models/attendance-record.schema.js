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
exports.AttendanceRecordSchema = exports.AttendanceRecord = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AttendanceRecord = class AttendanceRecord {
    employeeId;
    punches;
    totalWorkMinutes;
    hasMissedPunch;
    exceptionIds;
    finalisedForPayroll;
};
exports.AttendanceRecord = AttendanceRecord;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AttendanceRecord.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: [] }),
    __metadata("design:type", Array)
], AttendanceRecord.prototype, "punches", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AttendanceRecord.prototype, "totalWorkMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AttendanceRecord.prototype, "hasMissedPunch", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'TimeException', default: [] }),
    __metadata("design:type", Array)
], AttendanceRecord.prototype, "exceptionIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AttendanceRecord.prototype, "finalisedForPayroll", void 0);
exports.AttendanceRecord = AttendanceRecord = __decorate([
    (0, mongoose_1.Schema)()
], AttendanceRecord);
exports.AttendanceRecordSchema = mongoose_1.SchemaFactory.createForClass(AttendanceRecord);
//# sourceMappingURL=attendance-record.schema.js.map