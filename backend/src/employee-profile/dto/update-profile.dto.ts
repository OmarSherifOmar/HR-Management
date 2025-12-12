import { IsString } from "class-validator";

export class UpdateProfileDto {
  readonly bio?: string;
  @IsString()
  mobilePhone?: string;
  readonly address?: string;
}