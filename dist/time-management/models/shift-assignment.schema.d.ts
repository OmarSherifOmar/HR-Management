import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
import { ShiftAssignmentStatus } from "./enums/index";
export type ShiftAssignmentDocument = HydratedDocument<ShiftAssignment>;
export declare class ShiftAssignment {
    employeeId?: Types.ObjectId;
    departmentId?: Types.ObjectId;
    positionId?: Types.ObjectId;
    shiftId: Types.ObjectId;
    scheduleRuleId?: Types.ObjectId;
    startDate: Date;
    endDate?: Date;
    status: ShiftAssignmentStatus;
}
export declare const ShiftAssignmentSchema: import("mongoose").Schema<ShiftAssignment, import("mongoose").Model<ShiftAssignment, any, any, any, import("mongoose").Document<unknown, any, ShiftAssignment, any, {}> & ShiftAssignment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ShiftAssignment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ShiftAssignment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ShiftAssignment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
