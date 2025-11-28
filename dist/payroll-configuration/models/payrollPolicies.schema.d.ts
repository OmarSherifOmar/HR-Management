import mongoose, { HydratedDocument } from 'mongoose';
import { Applicability, ConfigStatus, PolicyType } from '../enums/payroll-configuration-enums';
export type payrollPoliciesDocument = HydratedDocument<payrollPolicies>;
declare class RuleDefinition {
    percentage: number;
    fixedAmount: number;
    thresholdAmount: number;
}
export declare class payrollPolicies {
    policyName: string;
    policyType: PolicyType;
    description: string;
    effectiveDate: Date;
    ruleDefinition: RuleDefinition;
    applicability: Applicability;
    status: ConfigStatus;
    createdBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}
export declare const payrollPoliciesSchema: mongoose.Schema<payrollPolicies, mongoose.Model<payrollPolicies, any, any, any, mongoose.Document<unknown, any, payrollPolicies, any, {}> & payrollPolicies & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, payrollPolicies, mongoose.Document<unknown, {}, mongoose.FlatRecord<payrollPolicies>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<payrollPolicies> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
