import { IsNotEmpty, IsString, IsDateString, isNotEmpty } from 'class-validator';

export class InitiatePayrollDto {
  @IsNotEmpty()
  @IsDateString()
  payrollPeriod: string;

  @IsNotEmpty()
  @IsString()
  entity: string;

}

