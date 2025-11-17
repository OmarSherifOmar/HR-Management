import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreateBankFileDto {
  @IsString()
  payrollRunId: string;

  @IsString()
  fileName: string;

  @IsEnum(['ACH', 'SEPA', 'CSV', 'BAI2', 'CUSTOM'])
  format: string;

  @IsString()
  bankName: string;

  @IsString()
  @IsOptional()
  bankCode?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsNumber()
  @IsOptional()
  totalTransactions?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(['draft', 'queued', 'sent', 'acknowledged', 'failed'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  storagePath?: string;

  @IsArray()
  @IsOptional()
  errorMessages?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
