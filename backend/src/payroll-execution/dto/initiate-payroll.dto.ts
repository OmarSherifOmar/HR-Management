import { IsDateString, IsString, IsEnum } from 'class-validator';

export class InitiatePayrollDto {
  @IsDateString()
  periodStart: Date;

  @IsDateString()
  periodEnd: Date;

  @IsEnum(['Monthly', 'Bi-Weekly', 'Weekly'], {
    message: 'Payroll type must be monthly, bi-weekly, or weekly'
  })
  payPeriodType: string;

  @IsString()
  initiatorId: string;

  @IsString()
  payrollManagerId: string;
}
