import { IsNotEmpty, IsString } from 'class-validator';

export class FinanceRejectDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

