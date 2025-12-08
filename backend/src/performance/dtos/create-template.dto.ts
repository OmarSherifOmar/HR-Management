import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RatingScaleDto {
  @IsString()
  type: string;

  @IsNumber()
  min: number;

  @IsNumber()
  max: number;

  @IsOptional()
  @IsNumber()
  step?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}

export class EvaluationCriterionDto {
  @IsString()
  key: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  templateType: string;

  @ValidateNested()
  @Type(() => RatingScaleDto)
  ratingScale: RatingScaleDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationCriterionDto)
  criteria?: EvaluationCriterionDto[];

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDepartmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePositionIds?: string[];
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  templateType?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RatingScaleDto)
  ratingScale?: RatingScaleDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationCriterionDto)
  criteria?: EvaluationCriterionDto[];

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDepartmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePositionIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
