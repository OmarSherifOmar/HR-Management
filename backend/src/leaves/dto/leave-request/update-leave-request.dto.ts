import { IsMongoId, IsOptional, IsString, IsDateString } from 'class-validator';

/**
 * DTO for updating a pending leave request
 * 
 * Only includes fields that an employee can modify.
 * Cannot change: employeeId, status, approvalFlow (system-managed)
 * 
 * durationDays is recalculated automatically when dates change.
 */
export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsMongoId()
  attachmentId?: string;
}
