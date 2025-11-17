export class CreateTaxRuleDto {
  taxRate: number;
  exemptionAmount: number;
  threshold: number;
}

export class UpdateTaxRuleDto {
  taxRate?: number;
  exemptionAmount?: number;
  threshold?: number;
  status?: 'draft' | 'published';
  needsApprovalBy?: 'payroll_manager' | 'hr_manager';
  approved?: boolean;
  approvedAt?: Date | null;
}
   