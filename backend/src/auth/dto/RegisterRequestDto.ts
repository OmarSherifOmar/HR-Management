import {
  IsArray,
  IsEmail,
  IsInt,
  isInt,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';

export class RegisterRequestDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  password: string;

  @IsString()
  role: string = 'department employee';
}
