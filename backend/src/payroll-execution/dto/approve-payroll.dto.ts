import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ApprovePayrollDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsNotEmpty()
  @IsString()
  payrollSpecialistId: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

