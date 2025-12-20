import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsNotEmpty()
  payslipId: string;

  @IsString()
  @IsOptional()
  claimId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  status?: string;
}
