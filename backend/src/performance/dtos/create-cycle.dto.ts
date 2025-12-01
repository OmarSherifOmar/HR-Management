import { IsString, IsOptional, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CycleTemplateAssignmentDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];
}

export class CreateCycleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  cycleType: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsDateString()
  managerDueDate?: string;

  @IsOptional()
  @IsDateString()
  employeeAcknowledgementDueDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CycleTemplateAssignmentDto)
  templateAssignments?: CycleTemplateAssignmentDto[];
}

export class UpdateCycleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  managerDueDate?: string;

  @IsOptional()
  @IsDateString()
  employeeAcknowledgementDueDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CycleTemplateAssignmentDto)
  templateAssignments?: CycleTemplateAssignmentDto[];

  @IsOptional()
  @IsString()
  status?: string;
}
