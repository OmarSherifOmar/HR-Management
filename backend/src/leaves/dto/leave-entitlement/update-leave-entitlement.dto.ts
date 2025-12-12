import { IsMongoId, IsOptional, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLeaveEntitlementDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyEntitlement?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accruedActual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accruedRounded?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carryForward?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taken?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pending?: number;

  @IsOptional()
  @IsNumber()
  remaining?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastAccrualDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextResetDate?: Date;
}
