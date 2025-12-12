import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';

export class CreateDocumentDto {
  @IsMongoId()
  @IsOptional()
  ownerId?: string;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsDateString()
  @IsOptional()
  uploadedAt?: Date;
}