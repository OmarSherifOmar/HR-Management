import { IsString, IsOptional, IsDate, IsBoolean, IsArray, IsMongoId, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBlockedPeriodDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePositions?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  exemptEmployeeIds?: string[];

  @IsOptional()
  @IsNumber()
  maxLeavesAllowed?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
