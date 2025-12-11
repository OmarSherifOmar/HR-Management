import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateOvertimeRuleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;
}
