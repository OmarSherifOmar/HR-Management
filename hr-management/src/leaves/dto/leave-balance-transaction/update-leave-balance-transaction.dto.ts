import { IsMongoId, IsEnum, IsDate, IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../models/leave-balance-transaction.schema';

export class UpdateLeaveBalanceTransactionDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsMongoId()
  entitlementId?: string;

  @IsOptional()
  @IsMongoId()
  leaveRequestId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  transactionDate?: Date;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  balanceBefore?: number;

  @IsOptional()
  @IsNumber()
  balanceAfter?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRetroactive?: boolean;

  @IsOptional()
  @IsString()
  retroactiveReason?: string;

  @IsOptional()
  @IsMongoId()
  processedBy?: string;
}
