import { IsMongoId, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateLeaveAdjustmentDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsMongoId()
  entitlementId?: string;

  @IsOptional()
  @IsNumber()
  adjustmentAmount?: number;

  @IsOptional()
  @IsNumber()
  balanceBefore?: number;

  @IsOptional()
  @IsNumber()
  balanceAfter?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsMongoId()
  adjustedBy?: string;

  @IsOptional()
  @IsString()
  justification?: string;
}
