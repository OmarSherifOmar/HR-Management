import { HydratedDocument, Types } from 'mongoose';
import { StructureRequestStatus, StructureRequestType } from '../enums/organization-structure.enums';
export type StructureChangeRequestDocument = HydratedDocument<StructureChangeRequest>;
export declare class StructureChangeRequest {
    _id: Types.ObjectId;
    requestNumber: string;
    requestedByEmployeeId: Types.ObjectId;
    requestType: StructureRequestType;
    targetDepartmentId?: Types.ObjectId;
    targetPositionId?: Types.ObjectId;
    details?: string;
    reason?: string;
    status: StructureRequestStatus;
    submittedByEmployeeId?: Types.ObjectId;
    submittedAt?: Date;
}
export declare const StructureChangeRequestSchema: import("mongoose").Schema<StructureChangeRequest, import("mongoose").Model<StructureChangeRequest, any, any, any, import("mongoose").Document<unknown, any, StructureChangeRequest, any, {}> & StructureChangeRequest & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StructureChangeRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<StructureChangeRequest>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<StructureChangeRequest> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
