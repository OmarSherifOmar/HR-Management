import { IsEmail, IsMongoId, IsOptional, IsString } from "class-validator";

export class RegisterRequestDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  password: string;

  @IsString()
  role: string = "department employee";

  @IsMongoId()
  primaryPositionId: string;

  @IsOptional()
  @IsMongoId()
  supervisorPositionId?: string;
}