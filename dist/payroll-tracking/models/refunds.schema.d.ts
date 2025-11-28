import mongoose, { HydratedDocument } from 'mongoose';
import { RefundStatus } from '../enums/payroll-tracking-enum';
export type refundsDocument = HydratedDocument<refunds>;
export declare class refundDetails {
    description: string;
    amount: number;
}
export declare const refundDetailsSchema: mongoose.Schema<refundDetails, mongoose.Model<refundDetails, any, any, any, mongoose.Document<unknown, any, refundDetails, any, {}> & refundDetails & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, refundDetails, mongoose.Document<unknown, {}, mongoose.FlatRecord<refundDetails>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<refundDetails> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export declare class refunds {
    claimId?: mongoose.Types.ObjectId;
    disputeId?: mongoose.Types.ObjectId;
    refundDetails: refundDetails;
    employeeId: mongoose.Types.ObjectId;
    financeStaffId: mongoose.Types.ObjectId;
    status: RefundStatus;
    paidInPayrollRunId?: mongoose.Types.ObjectId;
}
export declare const refundsSchema: mongoose.Schema<refunds, mongoose.Model<refunds, any, any, any, mongoose.Document<unknown, any, refunds, any, {}> & refunds & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, refunds, mongoose.Document<unknown, {}, mongoose.FlatRecord<refunds>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<refunds> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
