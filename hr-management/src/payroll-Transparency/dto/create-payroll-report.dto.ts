import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePayrollReportDto {
  @IsNumber()
  periodMonth: number;

  @IsNumber()
  periodYear: number;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsNumber()
  totalSalaries: number;

  @IsNumber()
  totalTaxes: number;

  @IsNumber()
  totalInsurance: number;

  @IsNumber()
  totalAllowances: number;

  @IsNumber()
  totalDeductions: number;

  @IsString()
  generatedBy: string;
}
