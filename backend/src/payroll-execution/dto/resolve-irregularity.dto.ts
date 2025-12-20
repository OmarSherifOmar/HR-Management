import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class ResolveIrregularityDto {
  @IsNotEmpty()
  @IsString()
  employeePayrollDetailId: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  managerId?: string;

  @IsNotEmpty()
  @IsString()
  resolutionNotes: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['resolved', 'dismissed'])
  status: string; // 'resolved' or 'dismissed'
}

