import mongoose, { HydratedDocument } from 'mongoose';
import { PayRollPaymentStatus, PayRollStatus } from '../enums/payroll-execution-enum';
export type payrollRunsDocument = HydratedDocument<payrollRuns>;
export declare class payrollRuns {
    runId: string;
    payrollPeriod: Date;
    status: PayRollStatus;
    entity: string;
    employees: number;
    exceptions: number;
    totalnetpay: number;
    payrollSpecialistId: mongoose.Schema.Types.ObjectId;
    paymentStatus: PayRollPaymentStatus;
    payrollManagerId?: mongoose.Schema.Types.ObjectId;
    financeStaffId?: mongoose.Schema.Types.ObjectId;
    rejectionReason?: string;
    unlockReason?: string;
    managerApprovalDate?: Date;
    financeApprovalDate?: Date;
}
export declare const payrollRunsSchema: mongoose.Schema<payrollRuns, mongoose.Model<payrollRuns, any, any, any, mongoose.Document<unknown, any, payrollRuns, any, {}> & payrollRuns & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, payrollRuns, mongoose.Document<unknown, {}, mongoose.FlatRecord<payrollRuns>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<payrollRuns> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
