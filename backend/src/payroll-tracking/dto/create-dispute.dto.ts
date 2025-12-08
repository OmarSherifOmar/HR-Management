import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsOptional()
  claimId?: string;

  @IsString()
  @IsOptional()
  refundId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
