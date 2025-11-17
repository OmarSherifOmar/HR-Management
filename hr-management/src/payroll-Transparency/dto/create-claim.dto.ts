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

export class ClaimAttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsDateString()
  uploadedAt?: string;
}

export class ClaimApprovalStepDto {
  @IsString()
  role: string;

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

export class CreateClaimDto {
  @IsMongoId()
  employeeId: string;

  @IsString()
  type: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimAttachmentDto)
  attachments?: ClaimAttachmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimApprovalStepDto)
  approvalChain?: ClaimApprovalStepDto[];

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
