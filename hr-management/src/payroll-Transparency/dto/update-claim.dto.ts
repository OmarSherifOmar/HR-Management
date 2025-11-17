import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdateClaimAttachmentDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsDateString()
  uploadedAt?: string;
}

export class UpdateClaimApprovalStepDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsMongoId()
  approverId?: string;

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: string;

  @IsOptional()
  @IsDateString()
  decidedAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateClaimDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateClaimAttachmentDto)
  attachments?: UpdateClaimAttachmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateClaimApprovalStepDto)
  approvalChain?: UpdateClaimApprovalStepDto[];

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: string;

  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @IsOptional()
  @IsString()
  submittedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export default UpdateClaimDto;
