import { IsNotEmpty, IsString } from 'class-validator';

export class LockPayrollPeriodDto {
  @IsString()
  @IsNotEmpty()
  lockedBy: string;
}
