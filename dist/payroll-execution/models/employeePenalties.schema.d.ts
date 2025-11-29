import mongoose, { HydratedDocument } from 'mongoose';
export type penaltyDocument = HydratedDocument<penalty>;
declare class penalty {
    reason: string;
    amount: number;
}
export type employeePenaltiesDocument = HydratedDocument<employeePenalties>;
export declare class employeePenalties {
    employeeId: mongoose.Types.ObjectId;
    penalties?: penalty[];
}
export declare const employeePenaltiesSchema: mongoose.Schema<employeePenalties, mongoose.Model<employeePenalties, any, any, any, mongoose.Document<unknown, any, employeePenalties, any, {}> & employeePenalties & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, employeePenalties, mongoose.Document<unknown, {}, mongoose.FlatRecord<employeePenalties>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<employeePenalties> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
