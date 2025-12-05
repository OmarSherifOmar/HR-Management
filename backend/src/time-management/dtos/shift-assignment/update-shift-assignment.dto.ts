// dtos/shift-assignment/update-shift-assignment.dto.ts
import { IsMongoId, IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ShiftAssignmentStatus } from '../../models/enums';

export class UpdateShiftAssignmentDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsMongoId()
  positionId?: string;

  @IsOptional()
  @IsMongoId()
  shiftId?: string;

  @IsOptional()
  @IsMongoId()
  scheduleRuleId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string; // Can be null or date

  @IsOptional()
  @IsEnum(ShiftAssignmentStatus)
  status?: ShiftAssignmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}