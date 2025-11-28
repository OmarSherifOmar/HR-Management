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
exports.StructureChangeRequestSchema = exports.StructureChangeRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const organization_structure_enums_1 = require("../enums/organization-structure.enums");
let StructureChangeRequest = class StructureChangeRequest {
    _id;
    requestNumber;
    requestedByEmployeeId;
    requestType;
    targetDepartmentId;
    targetPositionId;
    details;
    reason;
    status;
    submittedByEmployeeId;
    submittedAt;
};
exports.StructureChangeRequest = StructureChangeRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, auto: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureChangeRequest.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], StructureChangeRequest.prototype, "requestNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureChangeRequest.prototype, "requestedByEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(organization_structure_enums_1.StructureRequestType),
        required: true,
    }),
    __metadata("design:type", String)
], StructureChangeRequest.prototype, "requestType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureChangeRequest.prototype, "targetDepartmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureChangeRequest.prototype, "targetPositionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], StructureChangeRequest.prototype, "details", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], StructureChangeRequest.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(organization_structure_enums_1.StructureRequestStatus),
        default: organization_structure_enums_1.StructureRequestStatus.DRAFT,
    }),
    __metadata("design:type", String)
], StructureChangeRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureChangeRequest.prototype, "submittedByEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], StructureChangeRequest.prototype, "submittedAt", void 0);
exports.StructureChangeRequest = StructureChangeRequest = __decorate([
    (0, mongoose_1.Schema)({ collection: 'structure_change_requests', timestamps: true })
], StructureChangeRequest);
exports.StructureChangeRequestSchema = mongoose_1.SchemaFactory.createForClass(StructureChangeRequest);
//# sourceMappingURL=structure-change-request.schema.js.map