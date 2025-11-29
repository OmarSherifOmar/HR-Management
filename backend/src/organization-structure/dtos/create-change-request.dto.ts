import { IsString, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { StructureRequestType } from '../enums/organization-structure.enums'; // adjust path if necessary

export class CreateChangeRequestDto {
  @IsString()
  // prefer to use enums; if you don't have enums, send string values per spec
  requestType: StructureRequestType | string;

  @IsOptional()
  @IsString()
  targetDepartmentId?: string;

  @IsOptional()
  @IsString()
  targetPositionId?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  reason?: string;








  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;













}
