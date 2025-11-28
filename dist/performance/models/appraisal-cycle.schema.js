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
exports.AppraisalCycleSchema = exports.AppraisalCycle = exports.CycleTemplateAssignmentSchema = exports.CycleTemplateAssignment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const performance_enums_1 = require("../enums/performance.enums");
let CycleTemplateAssignment = class CycleTemplateAssignment {
    templateId;
    departmentIds;
};
exports.CycleTemplateAssignment = CycleTemplateAssignment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AppraisalTemplate', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CycleTemplateAssignment.prototype, "templateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Department', default: [] }),
    __metadata("design:type", Array)
], CycleTemplateAssignment.prototype, "departmentIds", void 0);
exports.CycleTemplateAssignment = CycleTemplateAssignment = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CycleTemplateAssignment);
exports.CycleTemplateAssignmentSchema = mongoose_1.SchemaFactory.createForClass(CycleTemplateAssignment);
let AppraisalCycle = class AppraisalCycle {
    name;
    description;
    cycleType;
    startDate;
    endDate;
    managerDueDate;
    employeeAcknowledgementDueDate;
    templateAssignments;
    status;
    publishedAt;
    closedAt;
    archivedAt;
};
exports.AppraisalCycle = AppraisalCycle;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], AppraisalCycle.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalCycle.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(performance_enums_1.AppraisalTemplateType),
        required: true,
    }),
    __metadata("design:type", String)
], AppraisalCycle.prototype, "cycleType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], AppraisalCycle.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], AppraisalCycle.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalCycle.prototype, "managerDueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalCycle.prototype, "employeeAcknowledgementDueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.CycleTemplateAssignmentSchema], default: [] }),
    __metadata("design:type", Array)
], AppraisalCycle.prototype, "templateAssignments", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(performance_enums_1.AppraisalCycleStatus),
        default: performance_enums_1.AppraisalCycleStatus.PLANNED,
    }),
    __metadata("design:type", String)
], AppraisalCycle.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalCycle.prototype, "publishedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalCycle.prototype, "closedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], AppraisalCycle.prototype, "archivedAt", void 0);
exports.AppraisalCycle = AppraisalCycle = __decorate([
    (0, mongoose_1.Schema)({ collection: 'appraisal_cycles', timestamps: true })
], AppraisalCycle);
exports.AppraisalCycleSchema = mongoose_1.SchemaFactory.createForClass(AppraisalCycle);
//# sourceMappingURL=appraisal-cycle.schema.js.map