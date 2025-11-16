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
}
