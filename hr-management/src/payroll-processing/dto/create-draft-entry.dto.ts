import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreatePayrollDraftEntryDto {
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  @IsNotEmpty()
  grossSalary: number;

  @IsNumber()
  @IsNotEmpty()
  deductions: number;

  @IsNumber()
  @IsNotEmpty()
  netSalary: number;

  @IsNotEmpty()
  payrollRunId: string;
}
