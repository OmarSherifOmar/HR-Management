export class CreateInsuranceBracketDto {
  salaryFrom: number;
  salaryTo: number;
  employerPercentage: number;
  employeePercentage: number;
}

export class UpdateInsuranceBracketDto {
  salaryFrom?: number;
  salaryTo?: number;
  employerPercentage?: number;
  employeePercentage?: number;
  status?: 'draft' | 'published';
  needsApprovalBy?: 'payroll_manager' | 'hr_manager';
  approved?: boolean;
  approvedAt?: Date | null;
  // Phase 5 fields
  approvalStatus?: 'draft' | 'approved' | 'rejected';
  hrReviewComment?: string | null;
  approvedBy?: string | null;
  rejectedAt?: Date | null;
  updatedBy?: string | null;
}
