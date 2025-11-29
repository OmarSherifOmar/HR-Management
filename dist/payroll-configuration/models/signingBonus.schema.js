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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signingBonusSchema = exports.signingBonus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const employee_profile_schema_1 = require("../../employee-profile/models/employee-profile.schema");
const payroll_configuration_enums_1 = require("../enums/payroll-configuration-enums");
let signingBonus = class signingBonus {
    positionName;
    amount;
    status;
    createdBy;
    approvedBy;
    approvedAt;
};
exports.signingBonus = signingBonus;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], signingBonus.prototype, "positionName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], signingBonus.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: payroll_configuration_enums_1.ConfigStatus, default: payroll_configuration_enums_1.ConfigStatus.DRAFT }),
    __metadata("design:type", String)
], signingBonus.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], signingBonus.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], signingBonus.prototype, "approvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({}),
    __metadata("design:type", Date)
], signingBonus.prototype, "approvedAt", void 0);
exports.signingBonus = signingBonus = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], signingBonus);
exports.signingBonusSchema = mongoose_1.SchemaFactory.createForClass(signingBonus);
//# sourceMappingURL=signingBonus.schema.js.map