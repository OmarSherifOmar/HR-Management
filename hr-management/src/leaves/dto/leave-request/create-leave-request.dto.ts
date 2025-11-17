import { IsMongoId, IsDate, IsNumber, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveRequestStatus } from '../../models/leave-request.schema';

export class CreateLeaveRequestDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsNumber()
  totalDays: number;

  @IsOptional()
  @IsNumber()
  unpaidDays?: number;

  @IsString()
  reason: string;

  @IsEnum(LeaveRequestStatus)
  status: LeaveRequestStatus;

  @IsMongoId()
  managerId: string;

  @IsMongoId()
  hrApprovedBy: string;

  @IsOptional()
  @IsBoolean()
  isPostLeave?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  postLeaveSubmissionDate?: Date;
}
