import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class ApproveSigningBonusDto {
  @IsString()
  bonusId: string;

  @IsString()
  approverComments: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  adjustedAmount?: number;
}
