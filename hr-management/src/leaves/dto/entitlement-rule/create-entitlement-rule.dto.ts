import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, IsMongoId } from 'class-validator';
import { EligibilityCriteria } from '../../models/entitlement-rule.schema';
import { ContractType } from '../../../employee-organization-performancesubsystem/employee/models/contract-type.enum';

export class CreateEntitlementRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsEnum(EligibilityCriteria)
  eligibilityCriteria: EligibilityCriteria;

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

  @IsNumber()
  entitledDays: number;

  @IsOptional()
  @IsNumber()
  carryOverDays?: number;

  @IsOptional()
  @IsNumber()
  maxCarryOverCap?: number;

  @IsBoolean()
  allowProration: boolean;

  @IsOptional()
  @IsString()
  resetDate?: string;

  @IsEnum(['HIRE_DATE', 'WORK_RECEIVING_DATE', 'FISCAL_YEAR'])
  resetCriterion: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNumber()
  priority: number;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
