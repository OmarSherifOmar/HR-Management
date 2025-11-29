import mongoose, { HydratedDocument } from 'mongoose';
import { BonusStatus } from '../enums/payroll-execution-enum';
export type employeeSigningBonusDocument = HydratedDocument<employeeSigningBonus>;
export declare class employeeSigningBonus {
    employeeId: mongoose.Types.ObjectId;
    signingBonusId: mongoose.Types.ObjectId;
    paymentDate?: Date;
    status: BonusStatus;
}
export declare const employeeSigningBonusSchema: mongoose.Schema<employeeSigningBonus, mongoose.Model<employeeSigningBonus, any, any, any, mongoose.Document<unknown, any, employeeSigningBonus, any, {}> & employeeSigningBonus & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, employeeSigningBonus, mongoose.Document<unknown, {}, mongoose.FlatRecord<employeeSigningBonus>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<employeeSigningBonus> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
