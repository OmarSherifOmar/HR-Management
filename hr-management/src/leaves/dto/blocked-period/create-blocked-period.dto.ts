import { IsString, IsOptional, IsDate, IsBoolean, IsArray, IsMongoId, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBlockedPeriodDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePositions?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  exemptEmployeeIds: string[];

  @IsNumber()
  maxLeavesAllowed: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsMongoId()
  createdBy: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
