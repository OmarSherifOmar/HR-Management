import { HydratedDocument, Types } from 'mongoose';
import { AttachmentType } from '../enums/attachment-type.enum';
export type LeaveTypeDocument = HydratedDocument<LeaveType>;
export declare class LeaveType {
    code: string;
    name: string;
    categoryId: Types.ObjectId;
    description?: string;
    paid: boolean;
    deductible: boolean;
    requiresAttachment: boolean;
    attachmentType?: AttachmentType;
    minTenureMonths?: number;
    maxDurationDays?: number;
}
export declare const LeaveTypeSchema: import("mongoose").Schema<LeaveType, import("mongoose").Model<LeaveType, any, any, any, import("mongoose").Document<unknown, any, LeaveType, any, {}> & LeaveType & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LeaveType, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LeaveType>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<LeaveType> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
