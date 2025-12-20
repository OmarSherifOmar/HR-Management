import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class EditPayrollInitiationDto {
  @IsOptional()
  @IsString()
  runId?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: Date;

  @IsOptional()
  @IsDateString()
  periodEnd?: Date;

  @IsOptional()
  @IsEnum(['Monthly', 'Bi-Weekly', 'Weekly'])
  payPeriodType?: string;

  @IsOptional()
  @IsString()
  editReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
