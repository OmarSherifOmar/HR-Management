import { IsOptional, IsString } from 'class-validator';

export class PayrollReportQueryDto {
  @IsOptional()
  @IsString()
  month?: string;

  // Calendar year filter for annual payroll summaries (e.g., "2025")
  @IsOptional()
  @IsString()
  year?: string;
}
