import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class InitiatePayrollDto {
  @IsNotEmpty()
  @IsDateString()
  payrollPeriod: string;

  @IsNotEmpty()
  @IsString()
  entity: string;
}

