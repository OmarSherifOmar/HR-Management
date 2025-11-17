import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePayslipDto {
  @IsString()
  @IsNotEmpty()
  payrollRunId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  @IsNotEmpty()
  netSalary: number;

  @IsOptional()
  generatedAt?: Date;
}