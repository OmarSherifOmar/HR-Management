import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLatenessRuleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  gracePeriodMinutes!: number;

  @IsInt()
  @Min(0)
  deductionForEachMinute!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
