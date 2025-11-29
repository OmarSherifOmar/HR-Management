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
exports.JobRequisitionSchema = exports.JobRequisition = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let JobRequisition = class JobRequisition {
    requisitionId;
    templateId;
    openings;
    location;
    hiringManagerId;
    publishStatus;
    postingDate;
    expiryDate;
};
exports.JobRequisition = JobRequisition;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], JobRequisition.prototype, "requisitionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'JobTemplate' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], JobRequisition.prototype, "templateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], JobRequisition.prototype, "openings", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], JobRequisition.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], JobRequisition.prototype, "hiringManagerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['draft', 'published', 'closed'],
        default: 'draft'
    }),
    __metadata("design:type", String)
], JobRequisition.prototype, "publishStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], JobRequisition.prototype, "postingDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], JobRequisition.prototype, "expiryDate", void 0);
exports.JobRequisition = JobRequisition = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], JobRequisition);
exports.JobRequisitionSchema = mongoose_1.SchemaFactory.createForClass(JobRequisition);
//# sourceMappingURL=job-requisition.schema.js.map