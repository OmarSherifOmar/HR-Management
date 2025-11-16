import { IsOptional, IsEnum, IsString, IsMongoId, IsDateString } from 'class-validator';
import { DisputeStatus } from '../models/appraisal-dispute.schema';

export class UpdateAppraisalDisputeDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsMongoId()
  resolvedBy?: string;

  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
}
