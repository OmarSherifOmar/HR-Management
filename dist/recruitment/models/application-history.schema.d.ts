import { HydratedDocument, Types } from 'mongoose';
export declare class ApplicationStatusHistory {
    applicationId: Types.ObjectId;
    oldStage: string;
    newStage: string;
    oldStatus: string;
    newStatus: string;
    changedBy: Types.ObjectId;
}
export type ApplicationStatusHistoryDocument = HydratedDocument<ApplicationStatusHistory>;
export declare const ApplicationStatusHistorySchema: import("mongoose").Schema<ApplicationStatusHistory, import("mongoose").Model<ApplicationStatusHistory, any, any, any, import("mongoose").Document<unknown, any, ApplicationStatusHistory, any, {}> & ApplicationStatusHistory & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ApplicationStatusHistory, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ApplicationStatusHistory>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ApplicationStatusHistory> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
