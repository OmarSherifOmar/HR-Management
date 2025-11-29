import { Types } from "mongoose";
import { AttendanceRecord } from "./attendance-record.schema";
import { HydratedDocument } from "mongoose";
import { CorrectionRequestStatus } from "./enums/index";
export type AttendanceCorrectionRequestDocument = HydratedDocument<AttendanceCorrectionRequest>;
export declare class AttendanceCorrectionRequest {
    employeeId: Types.ObjectId;
    attendanceRecord: AttendanceRecord;
    reason?: string;
    status: CorrectionRequestStatus;
}
export declare const AttendanceCorrectionRequestSchema: import("mongoose").Schema<AttendanceCorrectionRequest, import("mongoose").Model<AttendanceCorrectionRequest, any, any, any, import("mongoose").Document<unknown, any, AttendanceCorrectionRequest, any, {}> & AttendanceCorrectionRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AttendanceCorrectionRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AttendanceCorrectionRequest>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AttendanceCorrectionRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
