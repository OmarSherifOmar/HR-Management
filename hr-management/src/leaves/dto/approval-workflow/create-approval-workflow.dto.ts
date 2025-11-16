import { IsString, IsOptional, IsMongoId, IsArray, IsBoolean, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovalLevel } from '../../models/approval-workflow.schema';

export class WorkflowLevelDto {
  @IsEnum(ApprovalLevel)
  level: ApprovalLevel;

  @IsString()
  approverRole: string;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsNumber()
  autoEscalationHours?: number;
}

export class CreateApprovalWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePositions?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowLevelDto)
  levels: WorkflowLevelDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsMongoId()
  createdBy: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
