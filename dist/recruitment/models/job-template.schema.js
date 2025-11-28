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
exports.JobTemplateSchema = exports.JobTemplate = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let JobTemplate = class JobTemplate {
    title;
    department;
    qualifications;
    skills;
    description;
};
exports.JobTemplate = JobTemplate;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], JobTemplate.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], JobTemplate.prototype, "department", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], JobTemplate.prototype, "qualifications", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], JobTemplate.prototype, "skills", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], JobTemplate.prototype, "description", void 0);
exports.JobTemplate = JobTemplate = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], JobTemplate);
exports.JobTemplateSchema = mongoose_1.SchemaFactory.createForClass(JobTemplate);
//# sourceMappingURL=job-template.schema.js.map