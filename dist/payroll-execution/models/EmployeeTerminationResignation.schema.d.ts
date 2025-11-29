import mongoose, { HydratedDocument } from 'mongoose';
import { BenefitStatus } from '../enums/payroll-execution-enum';
export type EmployeeTerminationResignationDocument = HydratedDocument<EmployeeTerminationResignation>;
export declare class EmployeeTerminationResignation {
    employeeId: mongoose.Types.ObjectId;
    benefitId: mongoose.Types.ObjectId;
    terminationId: mongoose.Types.ObjectId;
    status: BenefitStatus;
}
export declare const EmployeeTerminationResignationSchema: mongoose.Schema<EmployeeTerminationResignation, mongoose.Model<EmployeeTerminationResignation, any, any, any, mongoose.Document<unknown, any, EmployeeTerminationResignation, any, {}> & EmployeeTerminationResignation & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, EmployeeTerminationResignation, mongoose.Document<unknown, {}, mongoose.FlatRecord<EmployeeTerminationResignation>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<EmployeeTerminationResignation> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
