import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  payGradeId: string;

  @IsNumber()
  @Min(18)
  age: number;

  @IsString()
  @IsNotEmpty()
  bankAccount: string;
}