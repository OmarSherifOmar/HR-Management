import mongoose, { HydratedDocument } from 'mongoose';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
export type payGradeDocument = HydratedDocument<payGrade>;
export declare class payGrade {
    grade: string;
    baseSalary: number;
    grossSalary: number;
    status: ConfigStatus;
    createdBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}
export declare const payGradeSchema: mongoose.Schema<payGrade, mongoose.Model<payGrade, any, any, any, mongoose.Document<unknown, any, payGrade, any, {}> & payGrade & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, payGrade, mongoose.Document<unknown, {}, mongoose.FlatRecord<payGrade>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<payGrade> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
