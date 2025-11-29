import { IsMongoId, IsOptional, IsNumber, IsString, IsDate, IsBoolean, IsArray, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveStatus } from '../../enums/leave-status.enum';

class LeaveDatesDto {
  @IsDate()
  @Type(() => Date)
  from: Date;

  @IsDate()
  @Type(() => Date)
  to: Date;
}

class ApprovalFlowItemDto {
  @IsMongoId()
  approverId: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actionDate?: Date;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateLeaveRequestDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @ValidateNested()
  @Type(() => LeaveDatesDto)
  dates: LeaveDatesDto;

  @IsNumber()
  @Min(0.5)
  durationDays: number;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsMongoId()
  attachmentId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalFlowItemDto)
  approvalFlow?: ApprovalFlowItemDto[];

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsBoolean()
  irregularPatternFlag?: boolean;
}
