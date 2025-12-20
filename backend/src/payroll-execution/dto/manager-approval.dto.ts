import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ManagerApprovalDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

