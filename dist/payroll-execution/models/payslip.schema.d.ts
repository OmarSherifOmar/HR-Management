import mongoose, { HydratedDocument } from 'mongoose';
import { allowance } from '../../payroll-configuration/models/allowance.schema';
import { signingBonus } from '../../payroll-configuration/models/signingBonus.schema';
import { terminationAndResignationBenefits } from '../../payroll-configuration/models/terminationAndResignationBenefits';
import { taxRules } from '../../payroll-configuration/models/taxRules.schema';
import { insuranceBrackets } from '../../payroll-configuration/models/insuranceBrackets.schema';
import { employeePenalties } from './employeePenalties.schema';
import { refundDetails } from '../../payroll-tracking/models/refunds.schema';
import { PaySlipPaymentStatus } from '../enums/payroll-execution-enum';
export type PayslipDocument = HydratedDocument<paySlip>;
declare class Earnings {
    baseSalary: number;
    allowances: allowance[];
    bonuses?: signingBonus[];
    benefits?: terminationAndResignationBenefits[];
    refunds?: refundDetails[];
}
declare class Deductions {
    taxes: taxRules[];
    insurances?: insuranceBrackets[];
    penalties?: employeePenalties;
}
export declare class paySlip {
    employeeId: mongoose.Types.ObjectId;
    payrollRunId: mongoose.Types.ObjectId;
    earningsDetails: Earnings;
    deductionsDetails: Deductions;
    totalGrossSalary: number;
    totaDeductions?: number;
    netPay: number;
    paymentStatus: PaySlipPaymentStatus;
}
export declare const paySlipSchema: mongoose.Schema<paySlip, mongoose.Model<paySlip, any, any, any, mongoose.Document<unknown, any, paySlip, any, {}> & paySlip & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, paySlip, mongoose.Document<unknown, {}, mongoose.FlatRecord<paySlip>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<paySlip> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
