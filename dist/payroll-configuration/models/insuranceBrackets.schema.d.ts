import mongoose, { HydratedDocument } from 'mongoose';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
export type insuranceBracketsDocument = HydratedDocument<insuranceBrackets>;
export declare class insuranceBrackets {
    name: string;
    amount: number;
    status: ConfigStatus;
    createdBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    minSalary: number;
    maxSalary: number;
    employeeRate: number;
    employerRate: number;
}
export declare const insuranceBracketsSchema: mongoose.Schema<insuranceBrackets, mongoose.Model<insuranceBrackets, any, any, any, mongoose.Document<unknown, any, insuranceBrackets, any, {}> & insuranceBrackets & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, insuranceBrackets, mongoose.Document<unknown, {}, mongoose.FlatRecord<insuranceBrackets>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<insuranceBrackets> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
