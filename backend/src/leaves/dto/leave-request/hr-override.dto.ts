import { IsOptional, IsString, IsEnum } from 'class-validator';

/**
 * DTO for HR override decision
 * 
 * REQ-026: HR Override Manager Decision
 */
export class HROverrideDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  comments?: string;
}
