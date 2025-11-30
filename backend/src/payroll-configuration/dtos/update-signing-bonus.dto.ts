import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSigningBonusDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  positionName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}