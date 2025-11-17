import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreatePayrollPeriodDto {
  @IsString()
  @IsNotEmpty()
  month: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;
}
