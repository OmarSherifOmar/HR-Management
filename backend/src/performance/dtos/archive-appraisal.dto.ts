import { IsString, IsOptional, IsArray } from 'class-validator';

export class ArchiveAppraisalDto {
  @IsString()
  appraisalRecordId: string;

  @IsString()
  archivedByEmployeeId: string;

  @IsOptional()
  @IsString()
  archiveReason?: string;
}

export class BulkArchiveAppraisalsDto {
  @IsString()
  cycleId: string;

  @IsString()
  archivedByEmployeeId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeAppraisalIds?: string[];
}
