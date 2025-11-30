import { IsEmail, IsString } from "class-validator"

export class SignInDto {
  @IsString()
  @IsEmail()
  email: string
  
  @IsString()
  password: string
}