import { HydratedDocument } from 'mongoose';
export type LeaveCategoryDocument = HydratedDocument<LeaveCategory>;
export declare class LeaveCategory {
    name: string;
    description?: string;
}
export declare const LeaveCategorySchema: import("mongoose").Schema<LeaveCategory, import("mongoose").Model<LeaveCategory, any, any, any, import("mongoose").Document<unknown, any, LeaveCategory, any, {}> & LeaveCategory & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LeaveCategory, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LeaveCategory>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<LeaveCategory> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
