// dtos/employee.dto.ts
import { IsOptional, IsString, IsArray, ArrayNotEmpty, IsMongoId } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @IsOptional()
  @IsString()
  homePhone?: string;

  @IsOptional()
  @IsString()
  personalEmail?: string;

  @IsOptional()
  address?: {
    city?: string;
    streetAddress?: string;
    country?: string;
  };
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  biography?: string;

  // profilePicture handled as multipart file -> controller will supply profilePictureUrl to service
}

export class CorrectionRequestDto {
  @IsString()
  field: string; // e.g. 'jobTitle' or 'primaryDepartmentId'

  @IsString()
  currentValue: string;

  @IsString()
  requestedValue: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class HrEditEmployeeDto {
  @IsOptional()
  @IsString()
  firstName?: string;
  @IsOptional()
  @IsString()
  lastName?: string;
  @IsOptional()
  @IsString()
  fullName?: string;
  @IsOptional()
  @IsString()
  workEmail?: string;
  @IsOptional()
  @IsString()
  employeeNumber?: string;
  @IsOptional()
  @IsString()
  biography?: string;
  @IsOptional()
  @IsMongoId()
  primaryDepartmentId?: string;
  @IsOptional()
  @IsMongoId()
  primaryPositionId?: string;
  @IsOptional()
  @IsString()
  mobilePhone?: string;
  @IsOptional()
  @IsString()
  personalEmail?: string;
  // add other editable fields as required
}

export class AssignRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  roles: string[]; // SystemRole names
  @IsOptional()
  permissions?: string[];
}
