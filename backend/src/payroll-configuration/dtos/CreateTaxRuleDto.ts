import { IsNotEmpty, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class CreateTaxRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  rate: number;

  // createdBy comes from auth or request context, not from body
}
