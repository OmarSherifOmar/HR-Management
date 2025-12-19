import { IsNotEmpty, IsString } from 'class-validator';

export class RejectPayrollDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsNotEmpty()
  @IsString()
  rejectionReason: string;

  @IsNotEmpty()
  @IsString()
  payrollSpecialistId: string;
}

