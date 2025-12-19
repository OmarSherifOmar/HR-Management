import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ProcessRefundDto {
  @IsMongoId()
  @IsNotEmpty()
  linkedId!: string; // disputeId or claimId

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;
}
