import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { Type } from 'class-transformer';

export class UpdateInsuranceBracketDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSalary?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSalary?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  employeeRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  employerRate?: number;

  @IsMongoId()
  @IsOptional()
  approvedBy?: string;

  @IsOptional()
  approvedAt?: Date;
}
