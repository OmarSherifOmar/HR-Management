import { Types } from 'mongoose';
import { GraduationType } from '../enums/employee-profile.enums';
export declare class EmployeeQualification {
    employeeProfileId: Types.ObjectId;
    establishmentName: string;
    graduationType: GraduationType;
}
export declare const EmployeeQualificationSchema: import("mongoose").Schema<EmployeeQualification, import("mongoose").Model<EmployeeQualification, any, any, any, import("mongoose").Document<unknown, any, EmployeeQualification, any, {}> & EmployeeQualification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EmployeeQualification, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<EmployeeQualification>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<EmployeeQualification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
