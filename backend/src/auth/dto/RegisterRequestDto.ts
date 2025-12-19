import { SystemRole } from "../../employee-profile/enums/employee-profile.enums";
import { IsArray, IsEmail, IsInt, isInt, IsMongoId, IsNumber, IsOptional, IsEnum, isString, IsString } from "class-validator";
import { EmployeeProfile } from "../../employee-profile/models/employee-profile.schema";
import { AddressSchema } from "../../employee-profile/models/user-schema";

export class RegisterRequestDto {
  @IsString()
  @IsEmail()
  email: string
  
  @IsString()
  number: string

  @IsString()
  name: string;
  
  @IsInt()
  age: number;

  @IsString()
  password: string;

  @IsEnum(SystemRole, { message: 'Invalid role. Must be one of the valid system roles.' })
  role: SystemRole = SystemRole.DEPARTMENT_EMPLOYEE;

  @IsOptional()
  @IsMongoId()
  primaryPositionId?: string;

  @IsOptional()
  @IsMongoId()
  supervisorPositionId?: string;
}
