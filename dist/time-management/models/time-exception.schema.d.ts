import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
import { TimeExceptionType, TimeExceptionStatus } from "./enums/index";
export type TimeExceptionDocument = HydratedDocument<TimeException>;
export declare class TimeException {
    employeeId: Types.ObjectId;
    type: TimeExceptionType;
    attendanceRecordId: Types.ObjectId;
    assignedTo: Types.ObjectId;
    status: TimeExceptionStatus;
    reason?: string;
}
export declare const TimeExceptionSchema: import("mongoose").Schema<TimeException, import("mongoose").Model<TimeException, any, any, any, import("mongoose").Document<unknown, any, TimeException, any, {}> & TimeException & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TimeException, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<TimeException>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TimeException> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
