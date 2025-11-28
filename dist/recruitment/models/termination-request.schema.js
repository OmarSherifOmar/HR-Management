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
exports.TerminationRequestSchema = exports.TerminationRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const termination_initiation_enum_1 = require("../enums/termination-initiation.enum");
const termination_status_enum_1 = require("../enums/termination-status.enum");
let TerminationRequest = class TerminationRequest {
    employeeId;
    initiator;
    reason;
    employeeComments;
    hrComments;
    status;
    terminationDate;
    contractId;
};
exports.TerminationRequest = TerminationRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TerminationRequest.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: termination_initiation_enum_1.TerminationInitiation,
        required: true
    }),
    __metadata("design:type", String)
], TerminationRequest.prototype, "initiator", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TerminationRequest.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TerminationRequest.prototype, "employeeComments", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TerminationRequest.prototype, "hrComments", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: termination_status_enum_1.TerminationStatus,
        default: termination_status_enum_1.TerminationStatus.PENDING
    }),
    __metadata("design:type", String)
], TerminationRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], TerminationRequest.prototype, "terminationDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Contract', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TerminationRequest.prototype, "contractId", void 0);
exports.TerminationRequest = TerminationRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], TerminationRequest);
exports.TerminationRequestSchema = mongoose_1.SchemaFactory.createForClass(TerminationRequest);
//# sourceMappingURL=termination-request.schema.js.map