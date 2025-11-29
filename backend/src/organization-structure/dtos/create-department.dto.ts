import { IsString, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // optional head position id
  @IsOptional()
  @IsString()
  headPositionId?: string;
}
