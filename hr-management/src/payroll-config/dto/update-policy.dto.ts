import { PolicyType } from '../models/payroll-policy.schema';

export class CreatePolicyDto {
  code: string;
  name: string;
  type: PolicyType;
  description: string;
  effectiveDate: Date | string;
  lawReference?: string;
  percentage?: number;
  fixedAmount?: number;
  threshold?: number;
  applicability?: string[];
}
 