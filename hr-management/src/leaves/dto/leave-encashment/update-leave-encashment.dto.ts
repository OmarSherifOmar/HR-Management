import { IsMongoId, IsEnum, IsDate, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EncashmentReason } from '../../models/leave-encashment.schema';

export class UpdateLeaveEncashmentDto {
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
  @IsEnum(EncashmentReason)
  encashmentReason?: EncashmentReason;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  encashmentDate?: Date;

  @IsOptional()
  @IsNumber()
  daysEncashed?: number;

  @IsOptional()
  @IsNumber()
  dailySalaryRate?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  balanceBefore?: number;

  @IsOptional()
  @IsNumber()
  balanceAfter?: number;

  @IsOptional()
  @IsMongoId()
  processedBy?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
