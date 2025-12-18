import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePayGradeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  grade?: string;

  @IsOptional()
  @IsNumber()
  @Min(6000)
  baseSalary?: number;
}
