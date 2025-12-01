import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class InitiatePayrollDto {
  @IsNotEmpty()
  @IsDateString()
  payrollPeriod: string;

  @IsNotEmpty()
  @IsString()
  entity: string;

  @IsOptional()
  @IsString()
  initiatorId?: string;

  @IsNotEmpty()
  @IsDateString()
  periodStart: string;

  @IsNotEmpty()
  @IsDateString()
  periodEnd: string;

  @IsNotEmpty()
  @IsString()
  payPeriodType: string;
}

