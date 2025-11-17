import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdatePayrollPeriodDto {
  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
