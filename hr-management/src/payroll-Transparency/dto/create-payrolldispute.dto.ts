import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreatePayrollDisputeDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsMongoId()
  @IsNotEmpty()
  payslipId: string;

  @IsEnum(['DEDUCTION_ERROR', 'ALLOWANCE_ERROR', 'TAX_ERROR', 'NET_SALARY_ERROR', 'OTHER'])
  disputeType: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsArray()
  attachments?: Array<{
    filename: string;
    url: string;
    contentType?: string;
  }>;
}
