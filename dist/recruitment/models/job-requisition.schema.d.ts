import { HydratedDocument, Types } from 'mongoose';
export declare class JobRequisition {
    requisitionId: string;
    templateId: Types.ObjectId;
    openings: number;
    location: string;
    hiringManagerId: Types.ObjectId;
    publishStatus: string;
    postingDate?: Date;
    expiryDate?: Date;
}
export type JobRequisitionDocument = HydratedDocument<JobRequisition>;
export declare const JobRequisitionSchema: import("mongoose").Schema<JobRequisition, import("mongoose").Model<JobRequisition, any, any, any, import("mongoose").Document<unknown, any, JobRequisition, any, {}> & JobRequisition & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, JobRequisition, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<JobRequisition>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<JobRequisition> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
