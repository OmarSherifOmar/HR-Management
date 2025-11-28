import mongoose, { HydratedDocument } from 'mongoose';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
export type terminationAndResignationBenefitsDocument = HydratedDocument<terminationAndResignationBenefits>;
export declare class terminationAndResignationBenefits {
    name: string;
    amount: number;
    terms?: string;
    status: ConfigStatus;
    createdBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}
export declare const terminationAndResignationBenefitsSchema: mongoose.Schema<terminationAndResignationBenefits, mongoose.Model<terminationAndResignationBenefits, any, any, any, mongoose.Document<unknown, any, terminationAndResignationBenefits, any, {}> & terminationAndResignationBenefits & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, terminationAndResignationBenefits, mongoose.Document<unknown, {}, mongoose.FlatRecord<terminationAndResignationBenefits>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<terminationAndResignationBenefits> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
