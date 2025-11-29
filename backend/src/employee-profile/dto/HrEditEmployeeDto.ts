import { IsString, IsOptional, IsMongoId } from 'class-validator';
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


  
}
