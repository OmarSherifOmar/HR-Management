import { IsString, IsEnum, IsBoolean, IsOptional, IsNumber, IsMongoId } from 'class-validator';
import { LeaveCategory, AccrualFrequency } from '../../models/leave-type.schema';

export class CreateLeaveTypeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(LeaveCategory)
  category: LeaveCategory;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresDocumentation?: boolean;

  @IsOptional()
  @IsNumber()
  documentationRequiredAfterDays?: number;

  @IsBoolean()
  deductFromAnnualBalance: boolean;

  @IsBoolean()
  isPaidLeave: boolean;

  @IsEnum(AccrualFrequency)
  accrualFrequency: AccrualFrequency;

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
  createdBy: string;

  @IsMongoId()
  updatedBy: string;
}
