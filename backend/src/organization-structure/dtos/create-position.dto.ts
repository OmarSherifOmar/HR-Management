import { IsString, IsOptional } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Department id (required)
  @IsString()
  departmentId: string;


  // Alternative: link by grade string (e.g. "Senior TA")
  @IsString()
  payGrade?: string;
  // Reports-to position id (optional)
  @IsOptional()
  @IsString()
  reportsToPositionId?: string;

  @IsOptional()
  isActive?: boolean;
}
