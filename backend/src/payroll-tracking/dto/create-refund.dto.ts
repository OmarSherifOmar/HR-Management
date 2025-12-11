import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRefundDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsOptional()
  payrollId?: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
