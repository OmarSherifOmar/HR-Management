import { IsNotEmpty, IsString } from 'class-validator';

export class RejectPayrollPeriodDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
