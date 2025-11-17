import { IsMongoId, IsEnum, IsDate, IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../models/leave-balance-transaction.schema';

export class CreateLeaveBalanceTransactionDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  entitlementId: string;

  @IsOptional()
  @IsMongoId()
  leaveRequestId?: string;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsDate()
  @Type(() => Date)
  transactionDate: Date;

  @IsNumber()
  amount: number;

  @IsNumber()
  balanceBefore: number;

  @IsNumber()
  balanceAfter: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRetroactive?: boolean;

  @IsOptional()
  @IsString()
  retroactiveReason?: string;

  @IsMongoId()
  processedBy: string;
}
