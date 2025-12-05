import { IsString, MinLength } from 'class-validator';

export class RejectSigningBonusDto {
  @IsString()
  bonusId: string;

  @IsString()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters' })
  rejectionReason: string;
}
