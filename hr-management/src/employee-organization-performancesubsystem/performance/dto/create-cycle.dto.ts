import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateCycleDto {
  @IsString() @IsNotEmpty() key: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() type: string; // "annual" etc
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
  @IsArray() templates: string[]; // template ids
  @IsOptional() @IsString() notes?: string;
}
