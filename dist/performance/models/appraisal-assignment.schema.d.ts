import { HydratedDocument, Types } from 'mongoose';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';
export type AppraisalAssignmentDocument = HydratedDocument<AppraisalAssignment>;
export declare class AppraisalAssignment {
    cycleId: Types.ObjectId;
    templateId: Types.ObjectId;
    employeeProfileId: Types.ObjectId;
    managerProfileId: Types.ObjectId;
    departmentId: Types.ObjectId;
    positionId?: Types.ObjectId;
    status: AppraisalAssignmentStatus;
    assignedAt: Date;
    dueDate?: Date;
    submittedAt?: Date;
    publishedAt?: Date;
    latestAppraisalId?: Types.ObjectId;
}
export declare const AppraisalAssignmentSchema: import("mongoose").Schema<AppraisalAssignment, import("mongoose").Model<AppraisalAssignment, any, any, any, import("mongoose").Document<unknown, any, AppraisalAssignment, any, {}> & AppraisalAssignment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AppraisalAssignment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AppraisalAssignment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AppraisalAssignment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
