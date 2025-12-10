import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class EscalateIrregularityDto {
  @IsNotEmpty()
  @IsString()
  employeePayrollDetailId: string;

  @IsNotEmpty()
  @IsString()
  irregularityDescription: string;

  @IsOptional()
  @IsString()
  escalationNotes?: string;

  @IsNotEmpty()
  @IsString()
  payrollSpecialistId: string;
}


