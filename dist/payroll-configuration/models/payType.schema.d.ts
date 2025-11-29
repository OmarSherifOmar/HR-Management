import mongoose, { HydratedDocument } from 'mongoose';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
export type payTypeDocument = HydratedDocument<payType>;
export declare class payType {
    type: string;
    amount: number;
    status: ConfigStatus;
    createdBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}
export declare const payTypeSchema: mongoose.Schema<payType, mongoose.Model<payType, any, any, any, mongoose.Document<unknown, any, payType, any, {}> & payType & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, payType, mongoose.Document<unknown, {}, mongoose.FlatRecord<payType>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<payType> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
