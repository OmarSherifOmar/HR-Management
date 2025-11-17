import { IsMongoId, IsDate, IsNumber, IsString, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveRequestStatus } from '../../models/leave-request.schema';

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  totalDays?: number;

  @IsOptional()
  @IsNumber()
  unpaidDays?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(LeaveRequestStatus)
  status?: LeaveRequestStatus;

  @IsOptional()
  @IsMongoId()
  managerId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  managerApprovedAt?: Date;

  @IsOptional()
  @IsString()
  managerComments?: string;

  @IsOptional()
  @IsMongoId()
  hrApprovedBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  hrApprovedAt?: Date;

  @IsOptional()
  @IsString()
  hrComments?: string;

  @IsOptional()
  @IsBoolean()
  documentsVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isPostLeave?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  postLeaveSubmissionDate?: Date;

  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  approvedAt?: Date;

  @IsOptional()
  @IsMongoId()
  rejectedBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  rejectedAt?: Date;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  cancelledAt?: Date;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastModifiedAt?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modificationHistory?: string[];

  @IsOptional()
  @IsBoolean()
  flaggedAsIrregular?: boolean;

  @IsOptional()
  @IsString()
  irregularityReason?: string;

  @IsOptional()
  @IsMongoId()
  flaggedIrregularBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  flaggedIrregularAt?: Date;
}
