import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class FinanceApprovalDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsNotEmpty()
  @IsString()
  financeStaffId: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

