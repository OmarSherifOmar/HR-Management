import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLatenessRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deductionForEachMinute?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
