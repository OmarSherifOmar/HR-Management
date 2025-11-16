import { IsString, IsNotEmpty } from 'class-validator';

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty()
  permissionId: string; 
}
