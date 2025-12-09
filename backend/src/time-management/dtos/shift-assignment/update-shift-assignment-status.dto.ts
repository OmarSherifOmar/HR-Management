import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ShiftAssignmentStatus } from '../../models/enums';

export class UpdateShiftAssignmentStatusDto {
  @IsMongoId()
  assignmentId: string;

  @IsEnum(ShiftAssignmentStatus)
  status: ShiftAssignmentStatus;

  @IsOptional()
  @IsString()
  reason?: string; // For audit trail
}