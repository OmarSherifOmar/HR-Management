import { Types } from 'mongoose';
import { ProfileChangeStatus } from '../enums/employee-profile.enums';
export declare class EmployeeProfileChangeRequest {
    requestId: string;
    employeeProfileId: Types.ObjectId;
    requestDescription: string;
    reason?: string;
    status: ProfileChangeStatus;
    submittedAt: Date;
    processedAt?: Date;
}
export declare const EmployeeProfileChangeRequestSchema: import("mongoose").Schema<EmployeeProfileChangeRequest, import("mongoose").Model<EmployeeProfileChangeRequest, any, any, any, import("mongoose").Document<unknown, any, EmployeeProfileChangeRequest, any, {}> & EmployeeProfileChangeRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EmployeeProfileChangeRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<EmployeeProfileChangeRequest>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<EmployeeProfileChangeRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
