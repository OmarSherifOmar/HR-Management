import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApprovalDecision } from '../enums/organization-structure.enums'; // adjust path if necessary

export class ApproveChangeRequestDto {
  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsEnum(ApprovalDecision)
  decision?: ApprovalDecision | string;
}
