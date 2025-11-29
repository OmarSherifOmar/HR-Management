import mongoose, { HydratedDocument } from 'mongoose';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
export type signingBonusDocument = HydratedDocument<signingBonus>;
export declare class signingBonus {
    positionName: string;
    amount: number;
    status: ConfigStatus;
    createdBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}
export declare const signingBonusSchema: mongoose.Schema<signingBonus, mongoose.Model<signingBonus, any, any, any, mongoose.Document<unknown, any, signingBonus, any, {}> & signingBonus & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, signingBonus, mongoose.Document<unknown, {}, mongoose.FlatRecord<signingBonus>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<signingBonus> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
