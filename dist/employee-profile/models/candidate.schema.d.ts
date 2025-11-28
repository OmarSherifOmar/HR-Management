import { HydratedDocument, Types } from 'mongoose';
import { CandidateStatus } from '../enums/employee-profile.enums';
import { UserProfileBase } from './user-schema';
export type CandidateDocument = HydratedDocument<Candidate>;
export declare class Candidate extends UserProfileBase {
    candidateNumber: string;
    departmentId?: Types.ObjectId;
    positionId?: Types.ObjectId;
    applicationDate?: Date;
    status: CandidateStatus;
    resumeUrl?: string;
    notes?: string;
}
export declare const CandidateSchema: import("mongoose").Schema<Candidate, import("mongoose").Model<Candidate, any, any, any, import("mongoose").Document<unknown, any, Candidate, any, {}> & Candidate & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Candidate, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Candidate>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Candidate> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
