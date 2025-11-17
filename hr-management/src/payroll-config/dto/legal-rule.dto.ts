export class CreateLegalRuleDto {
  lawTitle: string;
  description: string;
  effectiveDate: Date;
}

export class UpdateLegalRuleDto {
  lawTitle?: string;
  description?: string;
  effectiveDate?: Date;
  status?: 'draft' | 'published';
  needsApprovalBy?: 'payroll_manager' | 'hr_manager';
  approved?: boolean;
  approvedAt?: Date | null;
}
