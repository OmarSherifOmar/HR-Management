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
exports.ApplicationSchema = exports.Application = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const application_stage_enum_1 = require("../enums/application-stage.enum");
const application_status_enum_1 = require("../enums/application-status.enum");
let Application = class Application {
    candidateId;
    requisitionId;
    assignedHr;
    currentStage;
    status;
};
exports.Application = Application;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Candidate', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Application.prototype, "candidateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'JobRequisition', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Application.prototype, "requisitionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Application.prototype, "assignedHr", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: application_stage_enum_1.ApplicationStage,
        default: application_stage_enum_1.ApplicationStage.SCREENING
    }),
    __metadata("design:type", String)
], Application.prototype, "currentStage", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: application_status_enum_1.ApplicationStatus,
        default: application_status_enum_1.ApplicationStatus.SUBMITTED
    }),
    __metadata("design:type", String)
], Application.prototype, "status", void 0);
exports.Application = Application = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Application);
exports.ApplicationSchema = mongoose_1.SchemaFactory.createForClass(Application);
//# sourceMappingURL=application.schema.js.map