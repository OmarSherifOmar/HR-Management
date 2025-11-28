import { HydratedDocument, Types } from 'mongoose';
import { AdjustmentType } from '../enums/adjustment-type.enum';
export type LeaveAdjustmentDocument = HydratedDocument<LeaveAdjustment>;
export declare class LeaveAdjustment {
    employeeId: Types.ObjectId;
    leaveTypeId: Types.ObjectId;
    adjustmentType: AdjustmentType;
    amount: number;
    reason: string;
    hrUserId: Types.ObjectId;
}
export declare const LeaveAdjustmentSchema: import("mongoose").Schema<LeaveAdjustment, import("mongoose").Model<LeaveAdjustment, any, any, any, import("mongoose").Document<unknown, any, LeaveAdjustment, any, {}> & LeaveAdjustment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LeaveAdjustment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LeaveAdjustment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<LeaveAdjustment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
