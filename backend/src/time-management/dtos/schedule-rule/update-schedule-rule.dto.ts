import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateScheduleRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
