import { IsNumber, IsOptional, IsArray, IsString, IsDate, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class HolidayDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsOptional()
  @IsString()
  name?: string;
}

class BlockedPeriodDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateCalendarDto {
  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year?: number;

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
