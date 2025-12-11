import { IsNumber, IsOptional, IsArray, IsString, IsDate, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class HolidayDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  name: string;
}

class BlockedPeriodDto {
  @IsDate()
  @Type(() => Date)
  from: Date;

  @IsDate()
  @Type(() => Date)
  to: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateCalendarDto {
  @IsNumber()
  year: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HolidayDto)
  holidays?: HolidayDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockedPeriodDto)
  blockedPeriods?: BlockedPeriodDto[];
}
