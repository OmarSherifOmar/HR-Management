import { IsOptional, IsString } from 'class-validator';

export class PayrollReportQueryDto {
  @IsOptional()
  @IsString()
  month?: string;
}
