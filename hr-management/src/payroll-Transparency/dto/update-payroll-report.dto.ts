export class UpdatePayrollReportDto {
    employeeId?: string;
    reportPeriod?: string;
    grossSalary?: number;
    netSalary?: number;
    deductions?: number;
    bonuses?: number;
    taxes?: number;
    status?: 'draft' | 'submitted' | 'approved' | 'rejected';
    notes?: string;
    updatedAt?: Date;
}