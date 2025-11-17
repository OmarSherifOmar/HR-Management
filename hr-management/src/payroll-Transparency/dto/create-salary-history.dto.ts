import { IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSalaryHistoryDto {
  @IsMongoId()
  employeeId: string;

  @IsNumber()
  month: number;

  @IsNumber()
  year: number;

  @IsNumber()
  grossSalary: number;

  @IsNumber()
  netSalary: number;

  @IsMongoId()
  @IsNotEmpty()
  payslipId: string;
}

