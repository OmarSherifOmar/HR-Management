import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class EmployeeTerminationResignationEditDto {
  @IsString()
  benefitId: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  adjustedAmount?: number;

  @IsOptional()
  @IsString()
  editReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
