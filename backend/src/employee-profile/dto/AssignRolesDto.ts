import { IsArray,ArrayNotEmpty,IsOptional } from "class-validator";

export class AssignRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  roles: string[]; 
  @IsOptional()
  permissions?: string[];
}