import { IsOptional, IsString, IsBoolean } from 'class-validator';

/**
 * DTO for manager approval/rejection decision
 * 
 * REQ-021: Manager Approval
 * REQ-022: Manager Rejection
 */
export class ManagerDecisionDto {
  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsBoolean()
  irregularPatternFlag?: boolean;
}
