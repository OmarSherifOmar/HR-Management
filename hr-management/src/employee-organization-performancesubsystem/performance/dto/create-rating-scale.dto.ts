import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateRatingScaleDto {
  @IsString() @IsNotEmpty() key: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() items: Array<{ value: number; label: string; description?: string; weight?: number }>;
}
