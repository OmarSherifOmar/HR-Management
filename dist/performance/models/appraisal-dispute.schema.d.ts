import { HydratedDocument, Types } from 'mongoose';
import { AppraisalDisputeStatus } from '../enums/performance.enums';
export type AppraisalDisputeDocument = HydratedDocument<AppraisalDispute>;
export declare class AppraisalDispute {
    _id: Types.ObjectId;
    appraisalId: Types.ObjectId;
    assignmentId: Types.ObjectId;
    cycleId: Types.ObjectId;
    raisedByEmployeeId: Types.ObjectId;
    reason: string;
    details?: string;
    submittedAt: Date;
    status: AppraisalDisputeStatus;
    assignedReviewerEmployeeId?: Types.ObjectId;
    resolutionSummary?: string;
    resolvedAt?: Date;
    resolvedByEmployeeId?: Types.ObjectId;
}
export declare const AppraisalDisputeSchema: import("mongoose").Schema<AppraisalDispute, import("mongoose").Model<AppraisalDispute, any, any, any, import("mongoose").Document<unknown, any, AppraisalDispute, any, {}> & AppraisalDispute & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AppraisalDispute, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AppraisalDispute>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AppraisalDispute> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
