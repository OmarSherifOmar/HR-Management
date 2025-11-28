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
exports.LeaveTypeSchema = exports.LeaveType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const attachment_type_enum_1 = require("../enums/attachment-type.enum");
let LeaveType = class LeaveType {
    code;
    name;
    categoryId;
    description;
    paid;
    deductible;
    requiresAttachment;
    attachmentType;
    minTenureMonths;
    maxDurationDays;
};
exports.LeaveType = LeaveType;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], LeaveType.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], LeaveType.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'LeaveCategory', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LeaveType.prototype, "categoryId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], LeaveType.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], LeaveType.prototype, "paid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], LeaveType.prototype, "deductible", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], LeaveType.prototype, "requiresAttachment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: attachment_type_enum_1.AttachmentType }),
    __metadata("design:type", String)
], LeaveType.prototype, "attachmentType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], LeaveType.prototype, "minTenureMonths", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], LeaveType.prototype, "maxDurationDays", void 0);
exports.LeaveType = LeaveType = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], LeaveType);
exports.LeaveTypeSchema = mongoose_1.SchemaFactory.createForClass(LeaveType);
//# sourceMappingURL=leave-type.schema.js.map