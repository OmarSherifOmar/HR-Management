import { IsString, IsOptional } from 'class-validator';

export class CreateLeaveCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
