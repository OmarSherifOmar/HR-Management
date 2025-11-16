import { IsMongoId, IsNumber, IsOptional, IsBoolean, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeEntitlementDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsMongoId()
  entitlementRuleId: string;

  @IsNumber()
  year: number;

  @IsNumber()
  totalEntitled: number;

  @IsNumber()
  accrued: number;

  @IsNumber()
  carriedOver: number;

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

  @IsDate()
  @Type(() => Date)
  lastAccrualDate: Date;

  @IsDate()
  @Type(() => Date)
  nextAccrualDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
