import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ProcessRefundDto {
  @IsString()
  @IsNotEmpty()
  linkedId!: string; // disputeId, claimId, or Mongo _id

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;
}
