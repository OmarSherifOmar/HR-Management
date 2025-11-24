import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  AppraisalRatingScaleType,
  AppraisalTemplateType,
} from '../enums/performance.enums';
import { Department } from '../../organization-structure/models/department.schema';
import { Position } from '../../organization-structure/models/position.schema';

export type AppraisalTemplateDocument = HydratedDocument<AppraisalTemplate>;

@Schema({ _id: false })
export class RatingScaleDefinition {
  @Prop({
    type: String,
    enum: Object.values(AppraisalRatingScaleType),
    required: true,
  })
  type: AppraisalRatingScaleType;

  @Prop({ type: Number, required: true })
  min: number;

  @Prop({ type: Number, required: true })
  max: number;

  @Prop({ type: Number, default: 1 })
  step?: number;

  @Prop({ type: [String], default: [] })
  labels?: string[];
}

export const RatingScaleDefinitionSchema = SchemaFactory.createForClass(
  RatingScaleDefinition,
);

@Schema({ _id: false })
export class EvaluationCriterion {
  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  details?: string;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  weight?: number;

  @Prop({ type: Number })
  maxScore?: number;

  @Prop({ type: Boolean, default: true })
  required: boolean;
}

export const EvaluationCriterionSchema =
  SchemaFactory.createForClass(EvaluationCriterion);

@Schema({ collection: 'appraisal_templates', timestamps: true })
export class AppraisalTemplate {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(AppraisalTemplateType),
    required: true,
  })
  templateType: AppraisalTemplateType;

  @Prop({ type: RatingScaleDefinitionSchema, required: true })
  ratingScale: RatingScaleDefinition;

  @Prop({ type: [EvaluationCriterionSchema], default: [] })
  criteria: EvaluationCriterion[];

  @Prop({ type: String })
  instructions?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Department', default: [] })
  applicableDepartmentIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Position', default: [] })
  applicablePositionIds: Types.ObjectId[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const AppraisalTemplateSchema =
  SchemaFactory.createForClass(AppraisalTemplate);
