import { IsString, IsOptional, IsMongoId, IsBoolean, IsDateString } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  title: string;

  @IsMongoId()
  department: string;

  @IsOptional()
  @IsMongoId()
  reportsTo?: string;

  @IsOptional()
  @IsMongoId()
  filledBy?: string;

  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsDateString()
  closedOn?: string;

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
  payGrade?: string;
}
