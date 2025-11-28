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
exports.AttendanceCorrectionRequestSchema = exports.AttendanceCorrectionRequest = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const attendance_record_schema_1 = require("./attendance-record.schema");
const index_1 = require("./enums/index");
let AttendanceCorrectionRequest = class AttendanceCorrectionRequest {
    employeeId;
    attendanceRecord;
    reason;
    status;
};
exports.AttendanceCorrectionRequest = AttendanceCorrectionRequest;
__decorate([
    (0, mongoose_2.Prop)({ type: mongoose_1.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], AttendanceCorrectionRequest.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_2.Prop)({ type: mongoose_1.Types.ObjectId, ref: 'AttendanceRecord', required: true }),
    __metadata("design:type", attendance_record_schema_1.AttendanceRecord)
], AttendanceCorrectionRequest.prototype, "attendanceRecord", void 0);
__decorate([
    (0, mongoose_2.Prop)(),
    __metadata("design:type", String)
], AttendanceCorrectionRequest.prototype, "reason", void 0);
__decorate([
    (0, mongoose_2.Prop)({ enum: index_1.CorrectionRequestStatus, default: index_1.CorrectionRequestStatus.SUBMITTED }),
    __metadata("design:type", String)
], AttendanceCorrectionRequest.prototype, "status", void 0);
exports.AttendanceCorrectionRequest = AttendanceCorrectionRequest = __decorate([
    (0, mongoose_2.Schema)()
], AttendanceCorrectionRequest);
exports.AttendanceCorrectionRequestSchema = mongoose_2.SchemaFactory.createForClass(AttendanceCorrectionRequest);
//# sourceMappingURL=attendance-correction-request.schema.js.map