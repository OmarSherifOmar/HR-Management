import { IsMongoId, IsEnum, IsDate, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EncashmentReason } from '../../models/leave-encashment.schema';

export class CreateLeaveEncashmentDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsMongoId()
  entitlementId: string;

  @IsEnum(EncashmentReason)
  encashmentReason: EncashmentReason;

  @IsDate()
  @Type(() => Date)
  encashmentDate: Date;

  @IsNumber()
  daysEncashed: number;

  @IsNumber()
  dailySalaryRate: number;

  @IsNumber()
  totalAmount: number;

  @IsNumber()
  balanceBefore: number;

  @IsNumber()
  balanceAfter: number;

  @IsMongoId()
  processedBy: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
