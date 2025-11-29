import { HydratedDocument, Types } from 'mongoose';
import { ApprovalDecision } from '../enums/organization-structure.enums';
export type StructureApprovalDocument = HydratedDocument<StructureApproval>;
export declare class StructureApproval {
    _id: Types.ObjectId;
    changeRequestId: Types.ObjectId;
    approverEmployeeId: Types.ObjectId;
    decision: ApprovalDecision;
    decidedAt?: Date;
    comments?: string;
}
export declare const StructureApprovalSchema: import("mongoose").Schema<StructureApproval, import("mongoose").Model<StructureApproval, any, any, any, import("mongoose").Document<unknown, any, StructureApproval, any, {}> & StructureApproval & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StructureApproval, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<StructureApproval>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<StructureApproval> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
