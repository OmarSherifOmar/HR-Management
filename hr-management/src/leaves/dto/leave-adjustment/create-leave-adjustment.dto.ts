import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class CreateLeaveAdjustmentDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsMongoId()
  entitlementId: string;

  @IsNumber()
  adjustmentAmount: number;

  @IsNumber()
  balanceBefore: number;

  @IsNumber()
  balanceAfter: number;

  @IsString()
  reason: string;

  @IsMongoId()
  adjustedBy: string;

  @IsString()
  justification: string;
}
