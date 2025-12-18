import { IsMongoId, IsNotEmpty, IsOptional, IsNumber, IsString, IsArray, IsDateString } from 'class-validator';

export class CreateContractDto {
  @IsMongoId()
  @IsNotEmpty()
  offerId: string;

  @IsDateString()
  @IsOptional()
  acceptanceDate?: Date;

  @IsNumber()
  @IsNotEmpty()
  grossSalary: number;

  @IsNumber()
  @IsOptional()
  signingBonus?: number;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsArray()
  @IsOptional()
  benefits?: string[];

  @IsMongoId()
  @IsOptional()
  documentId?: string;

  @IsString()
  @IsOptional()
  employeeSignatureUrl?: string;

  @IsString()
  @IsOptional()
  employerSignatureUrl?: string;

  @IsDateString()
  @IsOptional()
  employeeSignedAt?: Date;

  @IsDateString()
  @IsOptional()
  employerSignedAt?: Date;
}