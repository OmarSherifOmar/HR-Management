import { IsString, IsEnum, IsBoolean, IsOptional, IsNumber, IsMongoId } from 'class-validator';
import { LeaveCategory, AccrualFrequency } from '../../models/leave-type.schema';

export class UpdateLeaveTypeDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(LeaveCategory)
  category?: LeaveCategory;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresDocumentation?: boolean;

  @IsOptional()
  @IsNumber()
  documentationRequiredAfterDays?: number;

  @IsOptional()
  @IsBoolean()
  deductFromAnnualBalance?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaidLeave?: boolean;

  @IsOptional()
  @IsEnum(AccrualFrequency)
  accrualFrequency?: AccrualFrequency;

  @IsOptional()
  @IsNumber()
  accrualRate?: number;

  @IsOptional()
  @IsNumber()
  maxCarryOver?: number;

  @IsOptional()
  @IsNumber()
  maxDaysPerYear?: number;

  @IsOptional()
  @IsNumber()
  minDaysNotice?: number;

  @IsOptional()
  @IsNumber()
  maxConsecutiveDays?: number;

  @IsOptional()
  @IsBoolean()
  excludeWeekends?: boolean;

  @IsOptional()
  @IsBoolean()
  excludeHolidays?: boolean;

  @IsOptional()
  @IsString()
  payrollPayCode?: string;

  @IsMongoId()
  updatedBy: string;
}
