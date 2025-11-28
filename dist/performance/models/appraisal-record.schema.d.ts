import { HydratedDocument, Types } from 'mongoose';
import { AppraisalRecordStatus } from '../enums/performance.enums';
export type AppraisalRecordDocument = HydratedDocument<AppraisalRecord>;
export declare class RatingEntry {
    key: string;
    title: string;
    ratingValue: number;
    ratingLabel?: string;
    weightedScore?: number;
    comments?: string;
}
export declare const RatingEntrySchema: import("mongoose").Schema<RatingEntry, import("mongoose").Model<RatingEntry, any, any, any, import("mongoose").Document<unknown, any, RatingEntry, any, {}> & RatingEntry & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RatingEntry, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<RatingEntry>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<RatingEntry> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class AppraisalRecord {
    assignmentId: Types.ObjectId;
    cycleId: Types.ObjectId;
    templateId: Types.ObjectId;
    employeeProfileId: Types.ObjectId;
    managerProfileId: Types.ObjectId;
    ratings: RatingEntry[];
    totalScore?: number;
    overallRatingLabel?: string;
    managerSummary?: string;
    strengths?: string;
    improvementAreas?: string;
    status: AppraisalRecordStatus;
    managerSubmittedAt?: Date;
    hrPublishedAt?: Date;
    publishedByEmployeeId?: Types.ObjectId;
    employeeViewedAt?: Date;
    employeeAcknowledgedAt?: Date;
    employeeAcknowledgementComment?: string;
    archivedAt?: Date;
}
export declare const AppraisalRecordSchema: import("mongoose").Schema<AppraisalRecord, import("mongoose").Model<AppraisalRecord, any, any, any, import("mongoose").Document<unknown, any, AppraisalRecord, any, {}> & AppraisalRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AppraisalRecord, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AppraisalRecord>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AppraisalRecord> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
