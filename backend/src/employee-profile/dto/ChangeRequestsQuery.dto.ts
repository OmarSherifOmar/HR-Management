import { IsOptional, IsString, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

export class ChangeRequestsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  employeeProfileId?: string;

  @IsOptional()
  @IsISO8601()
  submittedFrom?: string;

  @IsOptional()
  @IsISO8601()
  submittedTo?: string;

  @IsOptional()
  @IsISO8601()
  processedFrom?: string;

  @IsOptional()
  @IsISO8601()
  processedTo?: string;
}
