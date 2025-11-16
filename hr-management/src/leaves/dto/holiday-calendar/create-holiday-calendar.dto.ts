import { IsString, IsOptional, IsDate, IsEnum, IsNumber, IsBoolean, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { HolidayType } from '../../models/holiday-calendar.schema';

export class CreateHolidayCalendarDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsEnum(HolidayType)
  type: HolidayType;

  @IsNumber()
  year: number;

  @IsBoolean()
  isRecurring: boolean;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
