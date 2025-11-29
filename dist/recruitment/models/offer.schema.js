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
exports.OfferSchema = exports.Offer = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const offer_response_status_enum_1 = require("../enums/offer-response-status.enum");
const offer_final_status_enum_1 = require("../enums/offer-final-status.enum");
const approval_status_enum_1 = require("../enums/approval-status.enum");
let Offer = class Offer {
    applicationId;
    candidateId;
    hrEmployeeId;
    grossSalary;
    signingBonus;
    benefits;
    conditions;
    insurances;
    content;
    role;
    deadline;
    applicantResponse;
    approvers;
    finalStatus;
    candidateSignedAt;
    hrSignedAt;
    managerSignedAt;
};
exports.Offer = Offer;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Application', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Offer.prototype, "applicationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Candidate', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Offer.prototype, "candidateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Offer.prototype, "hrEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Offer.prototype, "grossSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Offer.prototype, "signingBonus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Array)
], Offer.prototype, "benefits", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Offer.prototype, "conditions", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Offer.prototype, "insurances", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Offer.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Offer.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Offer.prototype, "deadline", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: offer_response_status_enum_1.OfferResponseStatus,
        default: offer_response_status_enum_1.OfferResponseStatus.PENDING
    }),
    __metadata("design:type", String)
], Offer.prototype, "applicantResponse", void 0);
__decorate([
    (0, mongoose_1.Prop)([
        {
            employeeId: { type: mongoose_2.Types.ObjectId, ref: 'User' },
            role: String,
            status: { type: String, enum: approval_status_enum_1.ApprovalStatus },
            actionDate: Date,
            comment: String,
        }
    ]),
    __metadata("design:type", Array)
], Offer.prototype, "approvers", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: offer_final_status_enum_1.OfferFinalStatus,
        default: offer_final_status_enum_1.OfferFinalStatus.PENDING
    }),
    __metadata("design:type", String)
], Offer.prototype, "finalStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Offer.prototype, "candidateSignedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Offer.prototype, "hrSignedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Offer.prototype, "managerSignedAt", void 0);
exports.Offer = Offer = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Offer);
exports.OfferSchema = mongoose_1.SchemaFactory.createForClass(Offer);
//# sourceMappingURL=offer.schema.js.map