import { IsString, IsOptional, IsDate, IsEnum, IsNumber, IsBoolean, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { HolidayType } from '../../models/holiday-calendar.schema';

export class UpdateHolidayCalendarDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsOptional()
  @IsEnum(HolidayType)
  type?: HolidayType;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
