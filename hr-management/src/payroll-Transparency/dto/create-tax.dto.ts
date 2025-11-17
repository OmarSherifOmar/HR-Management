import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class InsuranceContributionDto {
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateTaxDto {
  @IsMongoId()
  employeeId: string;

  @IsNumber()
  @Type(() => Number)
  year: number;

  @IsNumber()
  @Type(() => Number)
  taxAmount: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsuranceContributionDto)
  insuranceContributions?: InsuranceContributionDto[];
}

export default CreateTaxDto;
