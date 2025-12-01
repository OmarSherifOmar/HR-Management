import { IsArray, IsEmail, IsInt, isInt, IsMongoId, IsNumber, IsOptional, isString, IsString } from "class-validator";
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
  password: string

  @IsString()
  role: string = "department employee";
}