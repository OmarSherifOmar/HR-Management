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
exports.TimeExceptionSchema = exports.TimeException = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const index_1 = require("./enums/index");
let TimeException = class TimeException {
    employeeId;
    type;
    attendanceRecordId;
    assignedTo;
    status;
    reason;
};
exports.TimeException = TimeException;
__decorate([
    (0, mongoose_2.Prop)({ type: mongoose_1.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], TimeException.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_2.Prop)({ enum: index_1.TimeExceptionType, required: true }),
    __metadata("design:type", String)
], TimeException.prototype, "type", void 0);
__decorate([
    (0, mongoose_2.Prop)({ type: mongoose_1.Types.ObjectId, ref: 'AttendanceRecord', required: true }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], TimeException.prototype, "attendanceRecordId", void 0);
__decorate([
    (0, mongoose_2.Prop)({ type: mongoose_1.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], TimeException.prototype, "assignedTo", void 0);
__decorate([
    (0, mongoose_2.Prop)({ enum: index_1.TimeExceptionStatus, default: index_1.TimeExceptionStatus.OPEN }),
    __metadata("design:type", String)
], TimeException.prototype, "status", void 0);
__decorate([
    (0, mongoose_2.Prop)(),
    __metadata("design:type", String)
], TimeException.prototype, "reason", void 0);
exports.TimeException = TimeException = __decorate([
    (0, mongoose_2.Schema)()
], TimeException);
exports.TimeExceptionSchema = mongoose_2.SchemaFactory.createForClass(TimeException);
//# sourceMappingURL=time-exception.schema.js.map