import { IsString, IsOptional, IsMongoId, IsBoolean, IsDateString } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;

  @IsOptional()
  @IsMongoId()
  manager?: string;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsDateString()
  closedOn?: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
