import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { Type } from 'class-transformer';

export class UpdateInsuranceBracketDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @Type(() => Number)
  @IsNumber()
  minSalary: number;

  @Type(() => Number)
  @IsNumber()
  maxSalary: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  employeeRate: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  employerRate: number;

  @IsMongoId()
  @IsOptional()
  approvedBy?: string;

  @IsOptional()
  approvedAt?: Date;
}
