import { IsMongoId, IsOptional, IsString, IsDateString } from 'class-validator';

/**
 * DTO for creating a new leave request
 * 
 * Only includes fields that an employee should provide.
 * System-managed fields (status, approvalFlow, irregularPatternFlag, durationDays) 
 * are set automatically by the service.
 * 
 * durationDays is calculated from startDate and endDate (business days only).
 */
export class CreateLeaveRequestDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string; // Optional - defaults to authenticated user

  @IsMongoId()
  leaveTypeId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsMongoId()
  attachmentId?: string;
}
