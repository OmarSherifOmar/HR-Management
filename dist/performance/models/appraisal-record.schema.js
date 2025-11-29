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
exports.AppraisalRecordSchema = exports.AppraisalRecord = exports.RatingEntrySchema = exports.RatingEntry = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const performance_enums_1 = require("../enums/performance.enums");
let RatingEntry = class RatingEntry {
    key;
    title;
    ratingValue;
    ratingLabel;
    weightedScore;
    comments;
};
exports.RatingEntry = RatingEntry;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], RatingEntry.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], RatingEntry.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], RatingEntry.prototype, "ratingValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], RatingEntry.prototype, "ratingLabel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], RatingEntry.prototype, "weightedScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], RatingEntry.prototype, "comments", void 0);
exports.RatingEntry = RatingEntry = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], RatingEntry);
exports.RatingEntrySchema = mongoose_1.SchemaFactory.createForClass(RatingEntry);
let AppraisalRecord = class AppraisalRecord {
    assignmentId;
    cycleId;
    templateId;
    employeeProfileId;
    managerProfileId;
    ratings;
    totalScore;
    overallRatingLabel;
    managerSummary;
    strengths;
    improvementAreas;
    status;
    managerSubmittedAt;
    hrPublishedAt;
    publishedByEmployeeId;
    employeeViewedAt;
    employeeAcknowledgedAt;
    employeeAcknowledgementComment;
    archivedAt;
};
exports.AppraisalRecord = AppraisalRecord;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalAssignment', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalRecord.prototype, "assignmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalCycle', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalRecord.prototype, "cycleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalTemplate', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalRecord.prototype, "templateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalRecord.prototype, "employeeProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalRecord.prototype, "managerProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.RatingEntrySchema], default: [] }),
    __metadata("design:type", Array)
], AppraisalRecord.prototype, "ratings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], AppraisalRecord.prototype, "totalScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalRecord.prototype, "overallRatingLabel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalRecord.prototype, "managerSummary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalRecord.prototype, "strengths", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalRecord.prototype, "improvementAreas", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(performance_enums_1.AppraisalRecordStatus),
        default: performance_enums_1.AppraisalRecordStatus.DRAFT,
    }),
    __metadata("design:type", String)
], AppraisalRecord.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalRecord.prototype, "managerSubmittedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalRecord.prototype, "hrPublishedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AppraisalRecord.prototype, "publishedByEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalRecord.prototype, "employeeViewedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalRecord.prototype, "employeeAcknowledgedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalRecord.prototype, "employeeAcknowledgementComment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalRecord.prototype, "archivedAt", void 0);
exports.AppraisalRecord = AppraisalRecord = __decorate([
    (0, mongoose_1.Schema)({ collection: 'appraisal_records', timestamps: true })
], AppraisalRecord);
exports.AppraisalRecordSchema = mongoose_1.SchemaFactory.createForClass(AppraisalRecord);
//# sourceMappingURL=appraisal-record.schema.js.map