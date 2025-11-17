import { IsMongoId, IsString, IsNumber, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeaveAttachmentDto {
  @IsMongoId()
  leaveRequestId: string;

  @IsString()
  documentType: string;

  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  mimeType: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsMongoId()
  verifiedBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  verifiedAt?: Date;

  @IsOptional()
  @IsString()
  verificationNotes?: string;

  @IsOptional()
  @IsMongoId()
  uploadedBy?: string;
}
