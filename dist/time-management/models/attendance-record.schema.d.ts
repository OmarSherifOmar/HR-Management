import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
import { PunchType } from "./enums/index";
export type Punch = {
    type: PunchType;
    time: Date;
};
export type AttendanceRecordDocument = HydratedDocument<AttendanceRecord>;
export declare class AttendanceRecord {
    employeeId: Types.ObjectId;
    punches: Punch[];
    totalWorkMinutes: number;
    hasMissedPunch: boolean;
    exceptionIds: Types.ObjectId[];
    finalisedForPayroll: boolean;
}
export declare const AttendanceRecordSchema: import("mongoose").Schema<AttendanceRecord, import("mongoose").Model<AttendanceRecord, any, any, any, import("mongoose").Document<unknown, any, AttendanceRecord, any, {}> & AttendanceRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AttendanceRecord, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AttendanceRecord>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AttendanceRecord> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
