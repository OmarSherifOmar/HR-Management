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
exports.CandidateSchema = exports.Candidate = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const employee_profile_enums_1 = require("../enums/employee-profile.enums");
const user_schema_1 = require("./user-schema");
let Candidate = class Candidate extends user_schema_1.UserProfileBase {
    candidateNumber;
    departmentId;
    positionId;
    applicationDate;
    status;
    resumeUrl;
    notes;
};
exports.Candidate = Candidate;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], Candidate.prototype, "candidateNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Department' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Candidate.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Position' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Candidate.prototype, "positionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Candidate.prototype, "applicationDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(employee_profile_enums_1.CandidateStatus),
        default: employee_profile_enums_1.CandidateStatus.APPLIED,
    }),
    __metadata("design:type", String)
], Candidate.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Candidate.prototype, "resumeUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Candidate.prototype, "notes", void 0);
exports.Candidate = Candidate = __decorate([
    (0, mongoose_1.Schema)({ collection: 'candidates', timestamps: true })
], Candidate);
exports.CandidateSchema = mongoose_1.SchemaFactory.createForClass(Candidate);
//# sourceMappingURL=candidate.schema.js.map