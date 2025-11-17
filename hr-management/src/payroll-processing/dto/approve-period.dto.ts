import { IsNotEmpty, IsString } from 'class-validator';

export class ApprovePayrollPeriodDto {
  @IsString()
  @IsNotEmpty()
  approvedBy: string; // employee id
}
