import { HydratedDocument, Types } from 'mongoose';
export declare class AssessmentResult {
    interviewId: Types.ObjectId;
    interviewerId: Types.ObjectId;
    score: number;
    comments?: string;
}
export type AssessmentResultDocument = HydratedDocument<AssessmentResult>;
export declare const AssessmentResultSchema: import("mongoose").Schema<AssessmentResult, import("mongoose").Model<AssessmentResult, any, any, any, import("mongoose").Document<unknown, any, AssessmentResult, any, {}> & AssessmentResult & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AssessmentResult, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AssessmentResult>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AssessmentResult> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
