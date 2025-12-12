import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ManagerApprovalDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsNotEmpty()
  @IsString()
  managerId: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

