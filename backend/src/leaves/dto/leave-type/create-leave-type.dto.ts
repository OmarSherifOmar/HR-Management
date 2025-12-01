import { IsString, IsOptional, IsBoolean, IsMongoId, IsEnum, IsNumber, Min } from 'class-validator';
import { AttachmentType } from '../../enums/attachment-type.enum';

export class CreateLeaveTypeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsMongoId()
  categoryId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @IsOptional()
  @IsBoolean()
  deductible?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAttachment?: boolean;

  @IsOptional()
  @IsEnum(AttachmentType)
  attachmentType?: AttachmentType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minTenureMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDurationDays?: number;
}
