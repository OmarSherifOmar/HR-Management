import { 
    IsString, IsNumber, IsArray, IsOptional, IsDate, IsEnum, 
    IsMongoId, ValidateNested 
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { OfferResponseStatus } from '../enums/offer-response-status.enum';
  import { OfferFinalStatus } from '../enums/offer-final-status.enum';
  import { ApprovalStatus } from '../enums/approval-status.enum';

  
  export class ApproverDto {
    @IsMongoId()
    employeeId: string;
  
    @IsString()
    role: string;
  
    @IsEnum(ApprovalStatus)
    status: ApprovalStatus;
  
    @IsDate()
    @IsOptional()
    actionDate?: Date;
  
    @IsString()
    @IsOptional()
    comment?: string;
  }
  
  export class CreateOfferDto {
    @IsMongoId()
    applicationId: string;
  
    @IsMongoId()
    candidateId: string;
  
    @IsMongoId()
    @IsOptional()
    hrEmployeeId?: string;
  
    @IsNumber()
    grossSalary: number;
  
    @IsNumber()
    @IsOptional()
    signingBonus?: number;
  
    @IsArray()
    @IsOptional()
    benefits?: string[];
  
    @IsString()
    @IsOptional()
    conditions?: string;
  
    @IsString()
    @IsOptional()
    insurances?: string;
  
    @IsString()
    content: string;
  
    @IsString()
    role: string;
  
    @IsDate()
    @Type(() => Date)
    deadline: Date;
  
    @IsEnum(OfferResponseStatus)
    @IsOptional()
    applicantResponse?: OfferResponseStatus;
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ApproverDto)
    @IsOptional()
    approvers?: ApproverDto[];
  
    @IsEnum(OfferFinalStatus)
    @IsOptional()
    finalStatus?: OfferFinalStatus;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    candidateSignedAt?: Date;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    hrSignedAt?: Date;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    managerSignedAt?: Date;
  }
  
  export class UpdateOfferDto {
    @IsMongoId()
    @IsOptional()
    hrEmployeeId?: string;
  
    @IsNumber()
    @IsOptional()
    grossSalary?: number;
  
    @IsNumber()
    @IsOptional()
    signingBonus?: number;
  
    @IsArray()
    @IsOptional()
    benefits?: string[];
  
    @IsString()
    @IsOptional()
    conditions?: string;
  
    @IsString()
    @IsOptional()
    insurances?: string;
  
    @IsString()
    @IsOptional()
    content?: string;
  
    @IsString()
    @IsOptional()
    role?: string;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    deadline?: Date;
  
    @IsEnum(OfferResponseStatus)
    @IsOptional()
    applicantResponse?: OfferResponseStatus;
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ApproverDto)
    @IsOptional()
    approvers?: ApproverDto[];
  
    @IsEnum(OfferFinalStatus)
    @IsOptional()
    finalStatus?: OfferFinalStatus;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    candidateSignedAt?: Date;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    hrSignedAt?: Date;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    managerSignedAt?: Date;
  }