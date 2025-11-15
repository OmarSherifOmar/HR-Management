import { IsString, IsOptional, IsMongoId, IsBoolean, IsDateString } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsMongoId()
  department?: string;

  @IsOptional()
  @IsMongoId()
  reportsTo?: string | null;

  @IsOptional()
  @IsMongoId()
  filledBy?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsDateString()
  closedOn?: string | null;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  wageType?: string;

  @IsOptional()
  @IsMongoId()
  payGrade?: string | null;
}
