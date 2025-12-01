import { IsString, IsOptional } from 'class-validator';

export class AcknowledgeAppraisalDto {
  @IsOptional()
  @IsString()
  appraisalRecordId?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
