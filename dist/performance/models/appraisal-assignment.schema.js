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
exports.AppraisalAssignmentSchema = exports.AppraisalAssignment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const performance_enums_1 = require("../enums/performance.enums");
let AppraisalAssignment = class AppraisalAssignment {
    cycleId;
    templateId;
    employeeProfileId;
    managerProfileId;
    departmentId;
    positionId;
    status;
    assignedAt;
    dueDate;
    submittedAt;
    publishedAt;
    latestAppraisalId;
};
exports.AppraisalAssignment = AppraisalAssignment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalCycle', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalAssignment.prototype, "cycleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalTemplate', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalAssignment.prototype, "templateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalAssignment.prototype, "employeeProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalAssignment.prototype, "managerProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Department', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalAssignment.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Position' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalAssignment.prototype, "positionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(performance_enums_1.AppraisalAssignmentStatus),
        default: performance_enums_1.AppraisalAssignmentStatus.NOT_STARTED,
    }),
    __metadata("design:type", String)
], AppraisalAssignment.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], AppraisalAssignment.prototype, "assignedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalAssignment.prototype, "dueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalAssignment.prototype, "submittedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalAssignment.prototype, "publishedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalRecord' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalAssignment.prototype, "latestAppraisalId", void 0);
exports.AppraisalAssignment = AppraisalAssignment = __decorate([
    (0, mongoose_1.Schema)({ collection: 'appraisal_assignments', timestamps: true })
], AppraisalAssignment);
exports.AppraisalAssignmentSchema = mongoose_1.SchemaFactory.createForClass(AppraisalAssignment);
//# sourceMappingURL=appraisal-assignment.schema.js.map