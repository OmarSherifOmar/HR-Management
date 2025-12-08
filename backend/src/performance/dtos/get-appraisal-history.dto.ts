import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { AppraisalRecordStatus } from '../enums/performance.enums';

export class GetAppraisalHistoryDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(AppraisalRecordStatus)
  status?: AppraisalRecordStatus;
}

export class GenerateOutcomeReportDto {
  @IsString()
  cycleId: string;

  @IsOptional()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsString()
  format?: 'JSON' | 'CSV' | 'PDF';

  @IsOptional()
  @IsBoolean()
  includeDisputes?: boolean;
}
