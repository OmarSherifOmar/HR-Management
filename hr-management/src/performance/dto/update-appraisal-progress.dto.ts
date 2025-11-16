import { IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdateAppraisalProgressDto {
  @IsOptional()
  @IsNumber()
  totalEmployees?: number;

  @IsOptional()
  @IsNumber()
  completed?: number;

  @IsOptional()
  @IsNumber()
  completionRate?: number;

  @IsOptional()
  @IsDateString()
  lastReminderSentAt?: string;
}
