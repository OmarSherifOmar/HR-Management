import { HydratedDocument, Types } from 'mongoose';
export type LeaveEntitlementDocument = HydratedDocument<LeaveEntitlement>;
export declare class LeaveEntitlement {
    employeeId: Types.ObjectId;
    leaveTypeId: Types.ObjectId;
    yearlyEntitlement: number;
    accruedActual: number;
    accruedRounded: number;
    carryForward: number;
    taken: number;
    pending: number;
    remaining: number;
    lastAccrualDate?: Date;
    nextResetDate?: Date;
}
export declare const LeaveEntitlementSchema: import("mongoose").Schema<LeaveEntitlement, import("mongoose").Model<LeaveEntitlement, any, any, any, import("mongoose").Document<unknown, any, LeaveEntitlement, any, {}> & LeaveEntitlement & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LeaveEntitlement, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LeaveEntitlement>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<LeaveEntitlement> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
