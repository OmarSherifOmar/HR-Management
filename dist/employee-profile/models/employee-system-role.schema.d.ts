import { HydratedDocument, Types } from 'mongoose';
import { SystemRole } from '../enums/employee-profile.enums';
export type EmployeeSystemRoleDocument = HydratedDocument<EmployeeSystemRole>;
export declare class EmployeeSystemRole {
    employeeProfileId: Types.ObjectId;
    roles: SystemRole[];
    permissions: string[];
    isActive: boolean;
}
export declare const EmployeeSystemRoleSchema: import("mongoose").Schema<EmployeeSystemRole, import("mongoose").Model<EmployeeSystemRole, any, any, any, import("mongoose").Document<unknown, any, EmployeeSystemRole, any, {}> & EmployeeSystemRole & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EmployeeSystemRole, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<EmployeeSystemRole>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<EmployeeSystemRole> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
