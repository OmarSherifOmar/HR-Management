import { IsString, IsNotEmpty, IsEnum, IsNumber, IsBoolean, IsOptional, Matches, IsMongoId } from 'class-validator';
import { PunchPolicy } from '../../models/enums/index';

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsNotEmpty()
  shiftType: string; // ObjectId reference to ShiftType

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format (e.g., 09:00)',
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format (e.g., 17:00)',
  })
  endTime: string;

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
