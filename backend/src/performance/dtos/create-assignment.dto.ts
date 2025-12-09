import { IsString, IsOptional, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SingleAssignmentDto {
  @IsString()
  employeeProfileId: string;

  @IsString()
  managerProfileId: string;

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class BulkAssignmentDto {
  @IsString()
  cycleId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleAssignmentDto)
  assignments?: SingleAssignmentDto[];
}

export class CreateAssignmentDto {
  @IsString()
  cycleId: string;

  @IsString()
  templateId: string;

  @IsString()
  employeeProfileId: string;

  @IsString()
  managerProfileId: string;

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
