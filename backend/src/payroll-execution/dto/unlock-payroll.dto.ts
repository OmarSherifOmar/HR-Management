import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UnlockPayrollDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(20, { message: 'Unlock reason must be at least 20 characters to document the exceptional circumstances' })
  unlockReason: string;
}

