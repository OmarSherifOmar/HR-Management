// src/shift/dto/create-shift.dto.ts
import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Shift } from '../models/shift.schema';

class SplitSegmentDto {
  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}

class RotationPatternDto {
  @IsString()
  shiftId: string;

  @IsNumber()
  @Min(1)
  days: number;
}

export class CreateShiftDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitSegmentDto)
  splitSegments?: SplitSegmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RotationPatternDto)
  rotationPattern?: RotationPatternDto[];

  @IsNumber()
  gracePeriodMinutes: number;
}