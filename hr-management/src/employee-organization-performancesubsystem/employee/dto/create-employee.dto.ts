import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, MinLength,IsEmail,IsUrl } from 'class-validator';
import { AccStatus } from '../models/acc-status.enum';
import { ContractType } from '../models/contract-type.enum';
import { RoleType } from '../models/role-type.enum';

export class CreateEmployeeDto {
  @IsOptional()
  @IsEnum(RoleType)
  roleType?: RoleType = RoleType.Employee;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsString() 
  @IsNotEmpty()
  @MinLength(3, { message: "Name must be at least 3 characters long" })
  firstName: string;


  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: "Name must be at least 3 characters long" })
  lastName: string;

  @IsOptional()
  @IsString()
  gender?: string;


  @IsOptional()
  @IsString()
  martialStatus?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(11, { message: "Number must be 11 characters long" })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Must be a valid URL format (e.g., https://example.com)' })
  profilePicture?: string;

  // governed (required by your schema)
  @IsOptional() @IsEnum(AccStatus) accStatus?: AccStatus;
  @IsString() @IsNotEmpty() jobTitle: string;
  @IsString() @IsNotEmpty() NationalId: string;
  @IsOptional() @IsNotEmpty() department: any; 
  @IsEnum(ContractType) @IsNotEmpty() contractType: ContractType;
  @IsDateString() @IsNotEmpty() dateOfHire: string;
  @IsDateString() @IsNotEmpty() dateOfContractExpiration: string;
  @IsString() @IsNotEmpty() payRate: string;
}
