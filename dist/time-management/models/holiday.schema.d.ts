import { HydratedDocument } from 'mongoose';
import { HolidayType } from './enums/index';
export type HolidayDocument = HydratedDocument<Holiday>;
export declare class Holiday {
    type: HolidayType;
    startDate: Date;
    endDate?: Date;
    name?: string;
    active: boolean;
}
export declare const HolidaySchema: import("mongoose").Schema<Holiday, import("mongoose").Model<Holiday, any, any, any, import("mongoose").Document<unknown, any, Holiday, any, {}> & Holiday & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Holiday, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Holiday>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Holiday> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
