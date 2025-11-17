import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  ValidateNested,
  IsBoolean,
} from 'class-validator';

export class UpdatePayslipAllowanceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePayslipDeductionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePayslipAttachmentDto {
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

export class UpdatePayslipDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsDateString()
  payDate?: string;

  @IsOptional()
  @IsMongoId()
  payGradeId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  basicSalary?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  grossSalary?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  netSalary?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePayslipAllowanceDto)
  allowances?: UpdatePayslipAllowanceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePayslipDeductionDto)
  deductions?: UpdatePayslipDeductionDto[];

  @IsOptional()
  @IsIn(['PROCESSED', 'PENDING', 'DISPUTED'])
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePayslipAttachmentDto)
  attachments?: UpdatePayslipAttachmentDto[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  claimRefs?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  disputeRefs?: string[];

  @IsOptional()
  @IsString()
  processedBy?: string;

  @IsOptional()
  @IsDateString()
  processedAt?: string;
}

export default UpdatePayslipDto;
