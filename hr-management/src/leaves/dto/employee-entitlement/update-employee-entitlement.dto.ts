import { IsMongoId, IsNumber, IsOptional, IsBoolean, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEmployeeEntitlementDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsMongoId()
  entitlementRuleId?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  totalEntitled?: number;

  @IsOptional()
  @IsNumber()
  accrued?: number;

  @IsOptional()
  @IsNumber()
  taken?: number;

  @IsOptional()
  @IsNumber()
  pending?: number;

  @IsOptional()
  @IsNumber()
  carriedOver?: number;

  @IsOptional()
  @IsNumber()
  manualAdjustment?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  pausedFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  pausedUntil?: Date;

  @IsOptional()
  @IsString()
  pauseReason?: string;

  @IsOptional()
  @IsString()
  LeavePeriodsId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastAccrualDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextAccrualDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
