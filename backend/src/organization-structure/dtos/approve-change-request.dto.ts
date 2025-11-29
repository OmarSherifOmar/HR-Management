import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApprovalDecision } from '../enums/organization-structure.enums'; // adjust path if necessary

export class ApproveChangeRequestDto {
  @IsOptional()
  @IsString()
  comments?: string;

  // optional explicit decision; default to APPROVED if used by controller
  @IsOptional()
  @IsEnum(ApprovalDecision)
  decision?: ApprovalDecision | string;
}
