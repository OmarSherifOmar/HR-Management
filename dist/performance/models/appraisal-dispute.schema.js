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
exports.AppraisalDisputeSchema = exports.AppraisalDispute = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const performance_enums_1 = require("../enums/performance.enums");
let AppraisalDispute = class AppraisalDispute {
    _id;
    appraisalId;
    assignmentId;
    cycleId;
    raisedByEmployeeId;
    reason;
    details;
    submittedAt;
    status;
    assignedReviewerEmployeeId;
    resolutionSummary;
    resolvedAt;
    resolvedByEmployeeId;
};
exports.AppraisalDispute = AppraisalDispute;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, auto: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalDispute.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalRecord', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalDispute.prototype, "appraisalId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalAssignment', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalDispute.prototype, "assignmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalCycle', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalDispute.prototype, "cycleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalDispute.prototype, "raisedByEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], AppraisalDispute.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalDispute.prototype, "details", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], AppraisalDispute.prototype, "submittedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(performance_enums_1.AppraisalDisputeStatus),
        default: performance_enums_1.AppraisalDisputeStatus.OPEN,
    }),
    __metadata("design:type", String)
], AppraisalDispute.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalDispute.prototype, "assignedReviewerEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalDispute.prototype, "resolutionSummary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalDispute.prototype, "resolvedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalDispute.prototype, "resolvedByEmployeeId", void 0);
exports.AppraisalDispute = AppraisalDispute = __decorate([
    (0, mongoose_1.Schema)({ collection: 'appraisal_disputes', timestamps: true })
], AppraisalDispute);
exports.AppraisalDisputeSchema = mongoose_1.SchemaFactory.createForClass(AppraisalDispute);
//# sourceMappingURL=appraisal-dispute.schema.js.map