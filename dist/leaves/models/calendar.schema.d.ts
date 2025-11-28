import { HydratedDocument, Types } from 'mongoose';
export type CalendarDocument = HydratedDocument<Calendar>;
export declare class Calendar {
    year: number;
    holidays: Types.ObjectId[];
    blockedPeriods: {
        from: Date;
        to: Date;
        reason: string;
    }[];
}
export declare const CalendarSchema: import("mongoose").Schema<Calendar, import("mongoose").Model<Calendar, any, any, any, import("mongoose").Document<unknown, any, Calendar, any, {}> & Calendar & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Calendar, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Calendar>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Calendar> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
