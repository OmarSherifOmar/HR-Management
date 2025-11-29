import mongoose, { HydratedDocument } from 'mongoose';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
export type allowanceDocument = HydratedDocument<allowance>;
export declare class allowance {
    name: string;
    amount: number;
    status: ConfigStatus;
    createdBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}
export declare const allowanceSchema: mongoose.Schema<allowance, mongoose.Model<allowance, any, any, any, mongoose.Document<unknown, any, allowance, any, {}> & allowance & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, allowance, mongoose.Document<unknown, {}, mongoose.FlatRecord<allowance>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<allowance> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
