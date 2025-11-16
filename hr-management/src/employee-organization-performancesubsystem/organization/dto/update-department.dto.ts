import { IsString, IsOptional, IsMongoId, IsBoolean, IsDateString } from 'class-validator';

export class UpdateDepartmentDto {
  @IsString()
  name?: string;

  @IsMongoId()
  parent?: string;

  @IsMongoId()
  manager?: string;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsDateString()
  closedOn?: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
