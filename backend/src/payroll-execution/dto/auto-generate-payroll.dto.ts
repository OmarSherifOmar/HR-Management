import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class AutoGeneratePayrollDto {
  @IsOptional()
  @IsDateString()
  payrollPeriod?: string; // If not provided, uses current month

  @IsNotEmpty()
  @IsString()
  entity: string;

  @IsNotEmpty()
  @IsString()
  payrollSpecialistId: string;
}

