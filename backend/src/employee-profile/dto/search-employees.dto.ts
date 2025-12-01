import {
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchEmployeesDto {
  @IsOptional()
  @IsString()
  query?: string; 

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RETIRED'])
  status?: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RETIRED';

  @IsOptional()
  @IsMongoId()
  managerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
