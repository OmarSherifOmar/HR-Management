import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';
export type NotificationLogDocument = HydratedDocument<NotificationLog>;
export declare class NotificationLog {
    to: Types.ObjectId;
    type: string;
    message?: string;
}
export declare const NotificationLogSchema: import("mongoose").Schema<NotificationLog, import("mongoose").Model<NotificationLog, any, any, any, import("mongoose").Document<unknown, any, NotificationLog, any, {}> & NotificationLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, NotificationLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<NotificationLog>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<NotificationLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
