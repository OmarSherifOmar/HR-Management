import { IsNotEmpty, IsString } from 'class-validator';

export class LockPayrollDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsNotEmpty()
  @IsString()
  lockReason: string;
}

