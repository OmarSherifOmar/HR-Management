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
exports.EmployeeProfileChangeRequestSchema = exports.EmployeeProfileChangeRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const employee_profile_enums_1 = require("../enums/employee-profile.enums");
let EmployeeProfileChangeRequest = class EmployeeProfileChangeRequest {
    requestId;
    employeeProfileId;
    requestDescription;
    reason;
    status;
    submittedAt;
    processedAt;
};
exports.EmployeeProfileChangeRequest = EmployeeProfileChangeRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], EmployeeProfileChangeRequest.prototype, "requestId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmployeeProfileChangeRequest.prototype, "employeeProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], EmployeeProfileChangeRequest.prototype, "requestDescription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], EmployeeProfileChangeRequest.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(employee_profile_enums_1.ProfileChangeStatus),
        default: employee_profile_enums_1.ProfileChangeStatus.PENDING,
    }),
    __metadata("design:type", String)
], EmployeeProfileChangeRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], EmployeeProfileChangeRequest.prototype, "submittedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], EmployeeProfileChangeRequest.prototype, "processedAt", void 0);
exports.EmployeeProfileChangeRequest = EmployeeProfileChangeRequest = __decorate([
    (0, mongoose_1.Schema)({ collection: 'employee_profile_change_requests', timestamps: true })
], EmployeeProfileChangeRequest);
exports.EmployeeProfileChangeRequestSchema = mongoose_1.SchemaFactory.createForClass(EmployeeProfileChangeRequest);
//# sourceMappingURL=ep-change-request.schema.js.map