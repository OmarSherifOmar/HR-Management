import { IsString, IsOptional, IsMongoId, IsBoolean, IsDateString } from 'class-validator';

export class UpdatePositionDto {
  @IsString()
  title?: string;

  @IsMongoId()
  department?: string;

  @IsOptional()
  @IsMongoId()
  reportsTo?: string | null;

  @IsOptional()
  @IsMongoId()
  filledBy?: string | null;

  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsDateString()
  closedOn?: string | null;

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
