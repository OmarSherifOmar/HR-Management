import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, Matches } from 'class-validator';
import { PunchPolicy } from '../../models/enums/index';

export class UpdateShiftDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  shiftType?: string; // ObjectId reference to ShiftType

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format (e.g., 09:00)',
  })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format (e.g., 17:00)',
  })
  endTime?: string;

  @IsEnum(PunchPolicy)
  @IsOptional()
  punchPolicy?: PunchPolicy;

  @IsNumber()
  @IsOptional()
  graceInMinutes?: number;

  @IsNumber()
  @IsOptional()
  graceOutMinutes?: number;

  @IsBoolean()
  @IsOptional()
  requiresApprovalForOvertime?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

