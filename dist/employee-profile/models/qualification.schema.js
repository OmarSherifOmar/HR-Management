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
exports.EmployeeQualificationSchema = exports.EmployeeQualification = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const employee_profile_enums_1 = require("../enums/employee-profile.enums");
let EmployeeQualification = class EmployeeQualification {
    employeeProfileId;
    establishmentName;
    graduationType;
};
exports.EmployeeQualification = EmployeeQualification;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeQualification.prototype, "employeeProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], EmployeeQualification.prototype, "establishmentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(employee_profile_enums_1.GraduationType),
        required: true,
    }),
    __metadata("design:type", String)
], EmployeeQualification.prototype, "graduationType", void 0);
exports.EmployeeQualification = EmployeeQualification = __decorate([
    (0, mongoose_1.Schema)({ collection: 'employee_qualifications', timestamps: true })
], EmployeeQualification);
exports.EmployeeQualificationSchema = mongoose_1.SchemaFactory.createForClass(EmployeeQualification);
//# sourceMappingURL=qualification.schema.js.map