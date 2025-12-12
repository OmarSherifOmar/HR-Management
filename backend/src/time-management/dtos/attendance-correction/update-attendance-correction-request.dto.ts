import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CorrectionRequestStatus } from '../../models/enums';

export class UpdateAttendanceCorrectionRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(CorrectionRequestStatus)
  status?: CorrectionRequestStatus;
}
