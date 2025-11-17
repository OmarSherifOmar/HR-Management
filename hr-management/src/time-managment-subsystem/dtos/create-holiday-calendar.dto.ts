import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HolidayType } from '../models/holiday-calendar.schema';

class HolidayItemDto {
  @IsDateString() //Must be a valid date string (ISO format)
  date: string;

  @IsString() //The name of the holiday (e.g. “Christmas”)
  name: string;

  @IsEnum(HolidayType) //The type of holiday (public, company, rest-day)
  type: HolidayType;
}

export class CreateHolidayCalendarDto {
  @IsString() //Calendar name (e.g. “Egypt 2025 Holidays”)
  name: string;

  @IsNumber() //The calendar year (e.g. 2025)
  year: number;

  @IsArray() //a list of holiday objects
  @ValidateNested({ each: true }) 
  @Type(() => HolidayItemDto)
  holidays: HolidayItemDto[];

  @IsArray()
  @ArrayMinSize(0)
  weeklyRestDays: number[]; //each number represents a day of the week (0=Sunday, 6=Saturday)
}

// Dependency: Attendance module will use holidays and weeklyRestDays
// when validating lateness, absence and overtime calculations.

// Dependency: Leaves module depends on holidays to exclude them from
// leave duration calculation.

// Dependency: Policy module may reference weekly rest days to avoid penalties.