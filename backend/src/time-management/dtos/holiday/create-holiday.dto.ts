import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { HolidayType } from '../../models/enums';

export class CreateHolidayDto {
  @IsEnum(HolidayType)
  type!: HolidayType;

  @IsISO8601()
  startDate!: string; // ISO date string

  @IsOptional()
  @IsISO8601()
  endDate?: string; // ISO date string

  @IsOptional()
  @IsString()
  name?: string;
}
