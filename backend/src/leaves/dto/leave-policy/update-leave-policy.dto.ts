import { IsMongoId, IsOptional, IsEnum, IsNumber, IsBoolean, Min, ValidateNested, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { AccrualMethod } from '../../enums/accrual-method.enum';
import { RoundingRule } from '../../enums/rounding-rule.enum';

class EligibilityDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minTenureMonths?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positionsAllowed?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contractTypesAllowed?: string[];
}

export class UpdateLeavePolicyDto {
  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsEnum(AccrualMethod)
  accrualMethod?: AccrualMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyRate?: number;

  @IsOptional()
  @IsBoolean()
  carryForwardAllowed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCarryForward?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiryAfterMonths?: number;

  @IsOptional()
  @IsEnum(RoundingRule)
  roundingRule?: RoundingRule;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minNoticeDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxConsecutiveDays?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => EligibilityDto)
  eligibility?: EligibilityDto;
}
