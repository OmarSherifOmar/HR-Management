import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";
import { SystemRole } from "../../employee-profile/enums/employee-profile.enums";

export class RegisterRequestDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

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