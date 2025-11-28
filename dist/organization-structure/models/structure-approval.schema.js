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
exports.StructureApprovalSchema = exports.StructureApproval = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const organization_structure_enums_1 = require("../enums/organization-structure.enums");
let StructureApproval = class StructureApproval {
    _id;
    changeRequestId;
    approverEmployeeId;
    decision;
    decidedAt;
    comments;
};
exports.StructureApproval = StructureApproval;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, auto: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureApproval.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'StructureChangeRequest',
        required: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureApproval.prototype, "changeRequestId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureApproval.prototype, "approverEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(organization_structure_enums_1.ApprovalDecision),
        default: organization_structure_enums_1.ApprovalDecision.PENDING,
    }),
    __metadata("design:type", String)
], StructureApproval.prototype, "decision", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], StructureApproval.prototype, "decidedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], StructureApproval.prototype, "comments", void 0);
exports.StructureApproval = StructureApproval = __decorate([
    (0, mongoose_1.Schema)({ collection: 'structure_approvals', timestamps: true })
], StructureApproval);
exports.StructureApprovalSchema = mongoose_1.SchemaFactory.createForClass(StructureApproval);
//# sourceMappingURL=structure-approval.schema.js.map