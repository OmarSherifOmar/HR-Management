import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { Department } from '../enums/department.enum';

export class UpdateDepartmentSignoffDto {
  @IsEnum(Department)
  department: Department;

  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsMongoId()
  signedOffBy: string;
}

