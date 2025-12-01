import { IsString, IsOptional } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  appraisalRecordId: string;

  @IsOptional()
  @IsString()
  raisedByEmployeeId?: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;
}
