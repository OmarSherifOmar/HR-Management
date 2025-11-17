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

export class PayslipAllowanceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class PayslipDeductionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class PayslipAttachmentDto {
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

export class CreatePayslipDto {
  @IsMongoId()
  employeeId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsDateString()
  payDate?: string;

  @IsOptional()
  @IsMongoId()
  payGradeId?: string;

  @IsNumber()
  @Type(() => Number)
  basicSalary: number;

  @IsNumber()
  @Type(() => Number)
  grossSalary: number;

  @IsNumber()
  @Type(() => Number)
  netSalary: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayslipAllowanceDto)
  allowances?: PayslipAllowanceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayslipDeductionDto)
  deductions?: PayslipDeductionDto[];

  @IsOptional()
  @IsIn(['PROCESSED', 'PENDING', 'DISPUTED'])
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayslipAttachmentDto)
  attachments?: PayslipAttachmentDto[];

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

export default CreatePayslipDto;
