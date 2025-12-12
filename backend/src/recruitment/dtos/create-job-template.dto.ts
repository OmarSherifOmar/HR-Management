import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateJobTemplateDto {
  @IsString()
  title: string;

  @IsString()
  department: string;

  @IsArray()
  @IsOptional()
  qualifications?: string[];

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateJobTemplateDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsArray()
  @IsOptional()
  qualifications?: string[];

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}