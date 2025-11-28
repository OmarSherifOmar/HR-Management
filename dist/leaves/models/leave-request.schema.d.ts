import { HydratedDocument, Types } from 'mongoose';
import { LeaveStatus } from '../enums/leave-status.enum';
export type LeaveRequestDocument = HydratedDocument<LeaveRequest>;
export declare class LeaveRequest {
    employeeId: Types.ObjectId;
    leaveTypeId: Types.ObjectId;
    dates: {
        from: Date;
        to: Date;
    };
    durationDays: number;
    justification?: string;
    attachmentId?: Types.ObjectId;
    approvalFlow: {
        role: string;
        status: string;
        decidedBy?: Types.ObjectId;
        decidedAt?: Date;
    }[];
    status: LeaveStatus;
    irregularPatternFlag: boolean;
}
export declare const LeaveRequestSchema: import("mongoose").Schema<LeaveRequest, import("mongoose").Model<LeaveRequest, any, any, any, import("mongoose").Document<unknown, any, LeaveRequest, any, {}> & LeaveRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LeaveRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LeaveRequest>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<LeaveRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
