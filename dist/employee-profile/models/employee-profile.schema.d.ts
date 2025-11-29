import { HydratedDocument, Types } from 'mongoose';
import { ContractType, EmployeeStatus, WorkType } from '../enums/employee-profile.enums';
import { AppraisalRatingScaleType } from '../../performance/enums/performance.enums';
import { UserProfileBase } from './user-schema';
export type EmployeeProfileDocument = HydratedDocument<EmployeeProfile>;
export declare class EmployeeProfile extends UserProfileBase {
    employeeNumber: string;
    dateOfHire: Date;
    workEmail?: string;
    biography?: string;
    contractStartDate?: Date;
    contractEndDate?: Date;
    contractType?: ContractType;
    workType?: WorkType;
    status: EmployeeStatus;
    statusEffectiveFrom?: Date;
    primaryPositionId?: Types.ObjectId;
    primaryDepartmentId?: Types.ObjectId;
    supervisorPositionId?: Types.ObjectId;
    payGradeId?: Types.ObjectId;
    lastAppraisalRecordId?: Types.ObjectId;
    lastAppraisalCycleId?: Types.ObjectId;
    lastAppraisalTemplateId?: Types.ObjectId;
    lastAppraisalDate?: Date;
    lastAppraisalScore?: number;
    lastAppraisalRatingLabel?: string;
    lastAppraisalScaleType?: AppraisalRatingScaleType;
    lastDevelopmentPlanSummary?: string;
}
export declare const EmployeeProfileSchema: import("mongoose").Schema<EmployeeProfile, import("mongoose").Model<EmployeeProfile, any, any, any, import("mongoose").Document<unknown, any, EmployeeProfile, any, {}> & EmployeeProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EmployeeProfile, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<EmployeeProfile>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<EmployeeProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
