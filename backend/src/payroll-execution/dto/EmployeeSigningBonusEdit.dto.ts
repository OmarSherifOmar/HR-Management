import { IsString, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class EditSigningBonusDto {
  @IsString()
  bonusId: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  adjustedAmount?: number;

  @IsOptional()
  @IsString()
  editReason?: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  paymentDate?: Date | string;
}
