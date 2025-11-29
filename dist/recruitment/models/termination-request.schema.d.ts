import { HydratedDocument, Types } from 'mongoose';
import { TerminationInitiation } from '../enums/termination-initiation.enum';
import { TerminationStatus } from '../enums/termination-status.enum';
export declare class TerminationRequest {
    employeeId: Types.ObjectId;
    initiator: TerminationInitiation;
    reason: string;
    employeeComments?: string;
    hrComments?: string;
    status: TerminationStatus;
    terminationDate?: Date;
    contractId: Types.ObjectId;
}
export type TerminationRequestDocument = HydratedDocument<TerminationRequest>;
export declare const TerminationRequestSchema: import("mongoose").Schema<TerminationRequest, import("mongoose").Model<TerminationRequest, any, any, any, import("mongoose").Document<unknown, any, TerminationRequest, any, {}> & TerminationRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TerminationRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<TerminationRequest>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TerminationRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
