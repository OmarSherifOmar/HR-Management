import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateShiftTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
