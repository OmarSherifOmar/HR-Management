import mongoose, { HydratedDocument } from 'mongoose';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
export type taxRulesDocument = HydratedDocument<taxRules>;
export declare class taxRules {
    name: string;
    description?: string;
    rate: number;
    status: ConfigStatus;
    createdBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}
export declare const taxRulesSchema: mongoose.Schema<taxRules, mongoose.Model<taxRules, any, any, any, mongoose.Document<unknown, any, taxRules, any, {}> & taxRules & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, taxRules, mongoose.Document<unknown, {}, mongoose.FlatRecord<taxRules>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<taxRules> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
