import { HydratedDocument, Types } from 'mongoose';
export type PositionAssignmentDocument = HydratedDocument<PositionAssignment>;
export declare class PositionAssignment {
    employeeProfileId: Types.ObjectId;
    positionId: Types.ObjectId;
    departmentId: Types.ObjectId;
    startDate: Date;
    endDate?: Date;
    changeRequestId?: Types.ObjectId;
    reason?: string;
    notes?: string;
}
export declare const PositionAssignmentSchema: import("mongoose").Schema<PositionAssignment, import("mongoose").Model<PositionAssignment, any, any, any, import("mongoose").Document<unknown, any, PositionAssignment, any, {}> & PositionAssignment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PositionAssignment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PositionAssignment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PositionAssignment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
