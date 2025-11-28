import mongoose, { HydratedDocument } from 'mongoose';
import { DisputeStatus } from '../enums/payroll-tracking-enum';
export type disputesDocument = HydratedDocument<disputes>;
export declare class disputes {
    disputeId: string;
    description: string;
    employeeId: mongoose.Types.ObjectId;
    financeStaffId?: mongoose.Types.ObjectId;
    payslipId: mongoose.Types.ObjectId;
    status: DisputeStatus;
    rejectionReason?: string;
    resolutionComment?: string;
}
export declare const disputesSchema: mongoose.Schema<disputes, mongoose.Model<disputes, any, any, any, mongoose.Document<unknown, any, disputes, any, {}> & disputes & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, disputes, mongoose.Document<unknown, {}, mongoose.FlatRecord<disputes>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<disputes> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
