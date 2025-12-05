import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateScheduleRuleDto {
  @IsString()
  name: string;

  @IsString()
  pattern: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
