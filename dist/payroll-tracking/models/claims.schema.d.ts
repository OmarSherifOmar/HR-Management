import mongoose, { HydratedDocument } from 'mongoose';
import { ClaimStatus } from '../enums/payroll-tracking-enum';
export type claimsDocument = HydratedDocument<claims>;
export declare class claims {
    claimId: string;
    description: string;
    claimType: string;
    employeeId: mongoose.Types.ObjectId;
    financeStaffId?: mongoose.Types.ObjectId;
    amount: number;
    approvedAmount?: number;
    status: ClaimStatus;
    rejectionReason?: string;
    resolutionComment?: string;
}
export declare const claimsSchema: mongoose.Schema<claims, mongoose.Model<claims, any, any, any, mongoose.Document<unknown, any, claims, any, {}> & claims & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, claims, mongoose.Document<unknown, {}, mongoose.FlatRecord<claims>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<claims> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
