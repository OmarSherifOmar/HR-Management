import { HydratedDocument, Types } from 'mongoose';
import { AppraisalRatingScaleType, AppraisalTemplateType } from '../enums/performance.enums';
export type AppraisalTemplateDocument = HydratedDocument<AppraisalTemplate>;
export declare class RatingScaleDefinition {
    type: AppraisalRatingScaleType;
    min: number;
    max: number;
    step?: number;
    labels?: string[];
}
export declare const RatingScaleDefinitionSchema: import("mongoose").Schema<RatingScaleDefinition, import("mongoose").Model<RatingScaleDefinition, any, any, any, import("mongoose").Document<unknown, any, RatingScaleDefinition, any, {}> & RatingScaleDefinition & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RatingScaleDefinition, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<RatingScaleDefinition>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<RatingScaleDefinition> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class EvaluationCriterion {
    key: string;
    title: string;
    details?: string;
    weight?: number;
    maxScore?: number;
    required: boolean;
}
export declare const EvaluationCriterionSchema: import("mongoose").Schema<EvaluationCriterion, import("mongoose").Model<EvaluationCriterion, any, any, any, import("mongoose").Document<unknown, any, EvaluationCriterion, any, {}> & EvaluationCriterion & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EvaluationCriterion, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<EvaluationCriterion>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<EvaluationCriterion> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class AppraisalTemplate {
    name: string;
    description?: string;
    templateType: AppraisalTemplateType;
    ratingScale: RatingScaleDefinition;
    criteria: EvaluationCriterion[];
    instructions?: string;
    applicableDepartmentIds: Types.ObjectId[];
    applicablePositionIds: Types.ObjectId[];
    isActive: boolean;
}
export declare const AppraisalTemplateSchema: import("mongoose").Schema<AppraisalTemplate, import("mongoose").Model<AppraisalTemplate, any, any, any, import("mongoose").Document<unknown, any, AppraisalTemplate, any, {}> & AppraisalTemplate & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AppraisalTemplate, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AppraisalTemplate>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AppraisalTemplate> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
