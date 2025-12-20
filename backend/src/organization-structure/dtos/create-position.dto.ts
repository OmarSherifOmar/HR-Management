import { IsString, IsOptional } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  payGradeId?: string;

  @IsOptional()
  @IsString()
  reportsToPositionId?: string;

  @IsOptional()
  isActive?: boolean;
}
