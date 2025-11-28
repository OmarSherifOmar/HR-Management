import { HydratedDocument, Types } from 'mongoose';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';
export type LeavePolicyDocument = HydratedDocument<LeavePolicy>;
export declare class LeavePolicy {
    leaveTypeId: Types.ObjectId;
    accrualMethod: AccrualMethod;
    monthlyRate: number;
    yearlyRate: number;
    carryForwardAllowed: boolean;
    maxCarryForward: number;
    expiryAfterMonths?: number;
    roundingRule: RoundingRule;
    minNoticeDays: number;
    maxConsecutiveDays?: number;
    eligibility: Record<string, any>;
}
export declare const LeavePolicySchema: import("mongoose").Schema<LeavePolicy, import("mongoose").Model<LeavePolicy, any, any, any, import("mongoose").Document<unknown, any, LeavePolicy, any, {}> & LeavePolicy & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LeavePolicy, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LeavePolicy>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<LeavePolicy> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
