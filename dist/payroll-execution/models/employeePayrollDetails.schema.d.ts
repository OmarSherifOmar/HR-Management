import mongoose, { HydratedDocument } from 'mongoose';
import { BankStatus } from '../enums/payroll-execution-enum';
export type employeePayrollDetailsDocument = HydratedDocument<employeePayrollDetails>;
export declare class employeePayrollDetails {
    employeeId: mongoose.Types.ObjectId;
    baseSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    netPay: number;
    bankStatus: BankStatus;
    exceptions?: string;
    bonus?: number;
    benefit?: number;
    payrollRunId: mongoose.Types.ObjectId;
}
export declare const employeePayrollDetailsSchema: mongoose.Schema<employeePayrollDetails, mongoose.Model<employeePayrollDetails, any, any, any, mongoose.Document<unknown, any, employeePayrollDetails, any, {}> & employeePayrollDetails & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, employeePayrollDetails, mongoose.Document<unknown, {}, mongoose.FlatRecord<employeePayrollDetails>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<employeePayrollDetails> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
