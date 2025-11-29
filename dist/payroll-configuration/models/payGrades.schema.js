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
exports.payGradeSchema = exports.payGrade = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const payroll_configuration_enums_1 = require("../enums/payroll-configuration-enums");
let payGrade = class payGrade {
    grade;
    baseSalary;
    grossSalary;
    status;
    createdBy;
    approvedBy;
    approvedAt;
};
exports.payGrade = payGrade;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], payGrade.prototype, "grade", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 6000 }),
    __metadata("design:type", Number)
], payGrade.prototype, "baseSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 6000 }),
    __metadata("design:type", Number)
], payGrade.prototype, "grossSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: payroll_configuration_enums_1.ConfigStatus, default: payroll_configuration_enums_1.ConfigStatus.DRAFT }),
    __metadata("design:type", String)
], payGrade.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'EmployeeProfile' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], payGrade.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'EmployeeProfile' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], payGrade.prototype, "approvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({}),
    __metadata("design:type", Date)
], payGrade.prototype, "approvedAt", void 0);
exports.payGrade = payGrade = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], payGrade);
exports.payGradeSchema = mongoose_1.SchemaFactory.createForClass(payGrade);
//# sourceMappingURL=payGrades.schema.js.map