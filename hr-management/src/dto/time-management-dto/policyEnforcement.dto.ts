import { IsNotEmpty, IsMongoId, IsBoolean, Min, IsEnum, IsOptional } from 'class-validator';

export enum RepeatedLatenessAction {
  Administrator = 'Administrator',
  Manager = 'Manager',
}

export class PolicyEnforcementDto {
  @IsNotEmpty()
  @IsMongoId()
  organizationId: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsMongoId()
  jobGradeId?: string;

  @IsOptional()
  @Min(0)
  overtime?: number;

  @IsOptional()
  @Min(0)
  shorttime?: number;

  @IsOptional()
  @Min(0)
  weekendWork?: number;

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @IsOptional()
  @Min(0)
  latenessThresholdMinutes?: number;

  @IsOptional()
  @Min(0)
  gracePeriodMinutes?: number;

  @IsOptional()
  @Min(0)
  latenessPenalty?: number;

  @IsOptional()
  calculationMethod?: string;

  @IsOptional()
  @Min(0)
  repeatedLatenessLimit?: number;

  @IsOptional()
  @IsEnum(RepeatedLatenessAction)
  repeatedLatenessAction?: RepeatedLatenessAction;
}