import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class ResolveIrregularityDto {
  @IsNotEmpty()
  @IsString()
  employeePayrollDetailId: string;

  @IsNotEmpty()
  @IsString()
  managerId: string;

  @IsNotEmpty()
  @IsString()
  resolutionNotes: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['resolved', 'dismissed'])
  status: string; // 'resolved' or 'dismissed'
}

