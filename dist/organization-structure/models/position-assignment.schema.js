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
exports.PositionAssignmentSchema = exports.PositionAssignment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const employee_profile_schema_1 = require("../../employee-profile/models/employee-profile.schema");
let PositionAssignment = class PositionAssignment {
    employeeProfileId;
    positionId;
    departmentId;
    startDate;
    endDate;
    changeRequestId;
    reason;
    notes;
};
exports.PositionAssignment = PositionAssignment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: employee_profile_schema_1.EmployeeProfile.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PositionAssignment.prototype, "employeeProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Position', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PositionAssignment.prototype, "positionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Department', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PositionAssignment.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], PositionAssignment.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], PositionAssignment.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'StructureChangeRequest' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PositionAssignment.prototype, "changeRequestId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], PositionAssignment.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], PositionAssignment.prototype, "notes", void 0);
exports.PositionAssignment = PositionAssignment = __decorate([
    (0, mongoose_1.Schema)({ collection: 'position_assignments', timestamps: true })
], PositionAssignment);
exports.PositionAssignmentSchema = mongoose_1.SchemaFactory.createForClass(PositionAssignment);
//# sourceMappingURL=position-assignment.schema.js.map