import { IsMongoId, IsDateString, IsOptional, IsString, ValidateIf, IsEnum } from 'class-validator';
import { ShiftAssignmentStatus } from '../../models/enums';

export class CreateShiftAssignmentDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsMongoId()
  positionId?: string;

  @IsMongoId()
  shiftId: string;

  @IsOptional()
  @IsMongoId()
  scheduleRuleId?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string; // null means ongoing

  @IsOptional()
  @IsEnum(ShiftAssignmentStatus)
  status?: ShiftAssignmentStatus = ShiftAssignmentStatus.PENDING;

  @IsOptional()
  @IsString()
  notes?: string;
}