import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, IsMongoId } from 'class-validator';
import { EligibilityCriteria, ContractType } from '../../models/entitlement-rule.schema';

export class UpdateEntitlementRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsEnum(EligibilityCriteria)
  eligibilityCriteria?: EligibilityCriteria;

  @IsOptional()
  @IsNumber()
  minTenureMonths?: number;

  @IsOptional()
  @IsNumber()
  maxTenureMonths?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(ContractType, { each: true })
  contractTypes?: ContractType[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grades?: string[];

  @IsOptional()
  @IsNumber()
  entitledDays?: number;

  @IsOptional()
  @IsNumber()
  carryOverDays?: number;

  @IsOptional()
  @IsNumber()
  maxCarryOverCap?: number;

  @IsOptional()
  @IsBoolean()
  allowProration?: boolean;

  @IsOptional()
  @IsString()
  resetDate?: string;

  @IsOptional()
  @IsEnum(['HIRE_DATE', 'WORK_RECEIVING_DATE', 'FISCAL_YEAR'])
  resetCriterion?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
