import { IsOptional, IsString, IsDateString, MinLength, isEmail, IsUrl, minLength, IsEmail } from 'class-validator';

export class UpdatePersonalDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Name must be at least 3 characters long" })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Name must be at least 3 characters long" })
  lastName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  martialStatus?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional() 
  @IsString()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email?: string;
  
  @IsOptional()
  @IsString() 
  @MinLength(11, { message: "Number must be 11 characters long" })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Must be a valid URL format (e.g., https://example.com)' })
  profilePicture?: string;

}
