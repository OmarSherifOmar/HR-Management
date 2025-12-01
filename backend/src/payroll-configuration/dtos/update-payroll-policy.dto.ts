import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Applicability, PolicyType } from '../enums/payroll-configuration-enums';

class UpdateRuleDefinitionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  thresholdAmount?: number;
}

export class UpdatePayrollPolicyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  policyName?: string;

  @IsOptional()
  @IsEnum(PolicyType)
  policyType?: PolicyType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateRuleDefinitionDto)
  ruleDefinition?: UpdateRuleDefinitionDto;

  @IsOptional()
  @IsEnum(Applicability)
  applicability?: Applicability;
}
