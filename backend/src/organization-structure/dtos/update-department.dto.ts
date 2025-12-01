import { IsString, IsOptional } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  headPositionId?: string;

  // Allow toggling active state from update if necessary
  @IsOptional()
  isActive?: boolean;
}
