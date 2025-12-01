import { IsString, IsOptional, IsEnum, IsNumber, IsObject } from 'class-validator';

export enum DisputeDecision {
  DENY = 'DENY',
  APPROVE_CHANGE = 'APPROVE_CHANGE',
}

export class ResolveDisputeDto {
  @IsString()
  disputeId: string;

  @IsString()
  resolvedByEmployeeId: string;

  @IsEnum(DisputeDecision)
  decision: DisputeDecision;

  @IsString()
  resolutionSummary: string;

  @IsOptional()
  @IsNumber()
  newTotalScore?: number;

  @IsOptional()
  @IsString()
  newOverallRatingLabel?: string;

  @IsOptional()
  @IsObject()
  updatedRatings?: Record<string, number>;
}
