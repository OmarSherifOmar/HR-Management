import { IsMongoId, IsString, IsNumber, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLeaveAttachmentDto {
  @IsOptional()
  @IsMongoId()
  leaveRequestId?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

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
