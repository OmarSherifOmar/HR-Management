import { IsNotEmpty, IsEnum, IsString, IsOptional, IsMongoId } from 'class-validator';
import { ApprovalDecision } from '../schemas/offboarding-request.schema';

/**
 * DTO for approving/rejecting an offboarding request
 */
export class ApprovalDto {
  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsMongoId()
  approverId: string;

  @IsNotEmpty()
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @IsOptional()
  @IsString()
  comments?: string;
}

