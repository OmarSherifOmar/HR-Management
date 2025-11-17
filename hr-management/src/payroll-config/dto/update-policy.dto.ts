import { PolicyType, PolicyStatus } from '../models/payroll-policy.schema';

export class UpdatePayrollPolicyDto {
  code?: string;
  name?: string;
  type?: PolicyType;
  description?: string;
  effectiveDate?: Date;
  lawReference?: string;
  percentage?: number;
  fixedAmount?: number;
  threshold?: number;
  applicability?: string[];
  status?: PolicyStatus;
}