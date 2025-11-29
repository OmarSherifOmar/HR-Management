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
exports.EmployeeSystemRoleSchema = exports.EmployeeSystemRole = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const employee_profile_enums_1 = require("../enums/employee-profile.enums");
let EmployeeSystemRole = class EmployeeSystemRole {
    employeeProfileId;
    roles;
    permissions;
    isActive;
};
exports.EmployeeSystemRole = EmployeeSystemRole;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'EmployeeProfile',
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeSystemRole.prototype, "employeeProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [String],
        enum: Object.values(employee_profile_enums_1.SystemRole),
        default: [],
    }),
    __metadata("design:type", Array)
], EmployeeSystemRole.prototype, "roles", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], EmployeeSystemRole.prototype, "permissions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], EmployeeSystemRole.prototype, "isActive", void 0);
exports.EmployeeSystemRole = EmployeeSystemRole = __decorate([
    (0, mongoose_1.Schema)({ collection: 'employee_system_roles', timestamps: true })
], EmployeeSystemRole);
exports.EmployeeSystemRoleSchema = mongoose_1.SchemaFactory.createForClass(EmployeeSystemRole);
//# sourceMappingURL=employee-system-role.schema.js.map