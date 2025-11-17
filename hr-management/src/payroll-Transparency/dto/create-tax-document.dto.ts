import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTaxDocumentDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  year: number;

  @IsEnum(['TAX_CERTIFICATE', 'INSURANCE_CERTIFICATE', 'INCOME_VERIFICATION'])
  documentType: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}
