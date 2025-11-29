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
exports.StructureChangeLogSchema = exports.StructureChangeLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const organization_structure_enums_1 = require("../enums/organization-structure.enums");
let StructureChangeLog = class StructureChangeLog {
    _id;
    action;
    entityType;
    entityId;
    performedByEmployeeId;
    summary;
    beforeSnapshot;
    afterSnapshot;
};
exports.StructureChangeLog = StructureChangeLog;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, auto: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureChangeLog.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(organization_structure_enums_1.ChangeLogAction), required: true }),
    __metadata("design:type", String)
], StructureChangeLog.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], StructureChangeLog.prototype, "entityType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureChangeLog.prototype, "entityId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StructureChangeLog.prototype, "performedByEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], StructureChangeLog.prototype, "summary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], StructureChangeLog.prototype, "beforeSnapshot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], StructureChangeLog.prototype, "afterSnapshot", void 0);
exports.StructureChangeLog = StructureChangeLog = __decorate([
    (0, mongoose_1.Schema)({ collection: 'structure_change_logs', timestamps: true })
], StructureChangeLog);
exports.StructureChangeLogSchema = mongoose_1.SchemaFactory.createForClass(StructureChangeLog);
//# sourceMappingURL=structure-change-log.schema.js.map