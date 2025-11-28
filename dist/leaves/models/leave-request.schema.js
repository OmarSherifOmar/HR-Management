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
exports.LeaveRequestSchema = exports.LeaveRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const leave_status_enum_1 = require("../enums/leave-status.enum");
let LeaveRequest = class LeaveRequest {
    employeeId;
    leaveTypeId;
    dates;
    durationDays;
    justification;
    attachmentId;
    approvalFlow;
    status;
    irregularPatternFlag;
};
exports.LeaveRequest = LeaveRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Employee', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveRequest.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'LeaveType', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveRequest.prototype, "leaveTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: { from: Date, to: Date },
        required: true,
    }),
    __metadata("design:type", Object)
], LeaveRequest.prototype, "dates", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], LeaveRequest.prototype, "durationDays", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], LeaveRequest.prototype, "justification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Attachment' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveRequest.prototype, "attachmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                role: String,
                status: String,
                decidedBy: { type: mongoose_2.Types.ObjectId, ref: 'Employee' },
                decidedAt: Date,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], LeaveRequest.prototype, "approvalFlow", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: leave_status_enum_1.LeaveStatus,
        default: leave_status_enum_1.LeaveStatus.PENDING,
    }),
    __metadata("design:type", String)
], LeaveRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], LeaveRequest.prototype, "irregularPatternFlag", void 0);
exports.LeaveRequest = LeaveRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], LeaveRequest);
exports.LeaveRequestSchema = mongoose_1.SchemaFactory.createForClass(LeaveRequest);
//# sourceMappingURL=leave-request.schema.js.map