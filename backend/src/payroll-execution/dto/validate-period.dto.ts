import { IsDateString, IsString, IsEnum } from 'class-validator';

export class ValidatePeriodDto {
  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsEnum(['Monthly', 'Bi-Weekly', 'Weekly'], {
    message: 'Payroll type must be monthly, bi-weekly, or weekly'
  })
  payPeriodType: string;
}
