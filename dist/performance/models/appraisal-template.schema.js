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
exports.AppraisalTemplateSchema = exports.AppraisalTemplate = exports.EvaluationCriterionSchema = exports.EvaluationCriterion = exports.RatingScaleDefinitionSchema = exports.RatingScaleDefinition = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const performance_enums_1 = require("../enums/performance.enums");
let RatingScaleDefinition = class RatingScaleDefinition {
    type;
    min;
    max;
    step;
    labels;
};
exports.RatingScaleDefinition = RatingScaleDefinition;
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(performance_enums_1.AppraisalRatingScaleType),
        required: true,
    }),
    __metadata("design:type", String)
], RatingScaleDefinition.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], RatingScaleDefinition.prototype, "min", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], RatingScaleDefinition.prototype, "max", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 1 }),
    __metadata("design:type", Number)
], RatingScaleDefinition.prototype, "step", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], RatingScaleDefinition.prototype, "labels", void 0);
exports.RatingScaleDefinition = RatingScaleDefinition = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], RatingScaleDefinition);
exports.RatingScaleDefinitionSchema = mongoose_1.SchemaFactory.createForClass(RatingScaleDefinition);
let EvaluationCriterion = class EvaluationCriterion {
    key;
    title;
    details;
    weight;
    maxScore;
    required;
};
exports.EvaluationCriterion = EvaluationCriterion;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], EvaluationCriterion.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], EvaluationCriterion.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], EvaluationCriterion.prototype, "details", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, min: 0, max: 100, default: 0 }),
    __metadata("design:type", Number)
], EvaluationCriterion.prototype, "weight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], EvaluationCriterion.prototype, "maxScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], EvaluationCriterion.prototype, "required", void 0);
exports.EvaluationCriterion = EvaluationCriterion = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], EvaluationCriterion);
exports.EvaluationCriterionSchema = mongoose_1.SchemaFactory.createForClass(EvaluationCriterion);
let AppraisalTemplate = class AppraisalTemplate {
    name;
    description;
    templateType;
    ratingScale;
    criteria;
    instructions;
    applicableDepartmentIds;
    applicablePositionIds;
    isActive;
};
exports.AppraisalTemplate = AppraisalTemplate;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], AppraisalTemplate.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalTemplate.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(performance_enums_1.AppraisalTemplateType),
        required: true,
    }),
    __metadata("design:type", String)
], AppraisalTemplate.prototype, "templateType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: exports.RatingScaleDefinitionSchema, required: true }),
    __metadata("design:type", RatingScaleDefinition)
], AppraisalTemplate.prototype, "ratingScale", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.EvaluationCriterionSchema], default: [] }),
    __metadata("design:type", Array)
], AppraisalTemplate.prototype, "criteria", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], AppraisalTemplate.prototype, "instructions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Department', default: [] }),
    __metadata("design:type", Array)
], AppraisalTemplate.prototype, "applicableDepartmentIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Position', default: [] }),
    __metadata("design:type", Array)
], AppraisalTemplate.prototype, "applicablePositionIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], AppraisalTemplate.prototype, "isActive", void 0);
exports.AppraisalTemplate = AppraisalTemplate = __decorate([
    (0, mongoose_1.Schema)({ collection: 'appraisal_templates', timestamps: true })
], AppraisalTemplate);
exports.AppraisalTemplateSchema = mongoose_1.SchemaFactory.createForClass(AppraisalTemplate);
//# sourceMappingURL=appraisal-template.schema.js.map