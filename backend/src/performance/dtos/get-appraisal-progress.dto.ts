import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';

export class GetAppraisalProgressDto {
  @IsString()
  cycleId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsEnum(AppraisalAssignmentStatus)
  filterByStatus?: AppraisalAssignmentStatus;
}
