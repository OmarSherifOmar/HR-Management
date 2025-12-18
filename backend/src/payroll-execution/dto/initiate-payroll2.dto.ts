import { IsNotEmpty, IsString, IsDateString, isNotEmpty } from 'class-validator';

export class InitiatePayrollDto2 {
  @IsNotEmpty()
  @IsDateString()
  payrollPeriod: string;

  @IsNotEmpty()
  @IsString()
  entity: string;

  @IsNotEmpty()
  @IsString()
  initiatorId: string;

  @IsNotEmpty()
  @IsDateString()
  periodStart: Date;

  @IsNotEmpty()
  @IsDateString()
  periodEnd: Date;

  @IsNotEmpty()
  @IsString()
  payPeriodType: string;

}

