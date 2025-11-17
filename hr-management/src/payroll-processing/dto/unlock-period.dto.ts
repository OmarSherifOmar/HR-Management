import { IsNotEmpty, IsString } from 'class-validator';

export class UnlockPayrollPeriodDto {
  @IsString()
  @IsNotEmpty()
  unlockedBy: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
