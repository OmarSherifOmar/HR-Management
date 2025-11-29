import { IsString, IsOptional } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  reportsToPositionId?: string;

  @IsString() 
  payGrade?: string;

  @IsOptional()
  isActive?: boolean;
}
