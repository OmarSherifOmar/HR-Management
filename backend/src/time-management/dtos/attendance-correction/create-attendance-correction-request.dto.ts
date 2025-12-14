import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceCorrectionRequestDto {
  @IsMongoId()
  employeeId!: string;

  @IsMongoId()
  attendanceRecordId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
