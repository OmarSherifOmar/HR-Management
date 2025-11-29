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
exports.InterviewSchema = exports.Interview = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const interview_method_enum_1 = require("../enums/interview-method.enum");
const interview_status_enum_1 = require("../enums/interview-status.enum");
const application_stage_enum_1 = require("../enums/application-stage.enum");
let Interview = class Interview {
    applicationId;
    stage;
    scheduledDate;
    method;
    panel;
    calendarEventId;
    videoLink;
    status;
    feedbackId;
    candidateFeedback;
};
exports.Interview = Interview;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Application', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Interview.prototype, "applicationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: application_stage_enum_1.ApplicationStage,
        required: true
    }),
    __metadata("design:type", String)
], Interview.prototype, "stage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Interview.prototype, "scheduledDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: interview_method_enum_1.InterviewMethod }),
    __metadata("design:type", String)
], Interview.prototype, "method", void 0);
__decorate([
    (0, mongoose_1.Prop)([{ type: mongoose_2.Types.ObjectId, ref: 'User' }]),
    __metadata("design:type", Array)
], Interview.prototype, "panel", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Interview.prototype, "calendarEventId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Interview.prototype, "videoLink", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: interview_status_enum_1.InterviewStatus,
        default: interview_status_enum_1.InterviewStatus.SCHEDULED
    }),
    __metadata("design:type", String)
], Interview.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AssessmentResult' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Interview.prototype, "feedbackId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Interview.prototype, "candidateFeedback", void 0);
exports.Interview = Interview = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Interview);
exports.InterviewSchema = mongoose_1.SchemaFactory.createForClass(Interview);
//# sourceMappingURL=interview.schema.js.map