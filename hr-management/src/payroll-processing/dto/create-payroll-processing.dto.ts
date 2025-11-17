import { IsString, IsNumber, IsOptional, IsEnum, IsDate } from 'class-validator';

export class CreatePayrollProcessingDto {
  @IsString()
  payrollRunId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @IsOptional()
  processedDate?: Date;

  @IsEnum(['draft', 'in_progress', 'completed', 'failed'])
  @IsOptional()
  status?: string;
}
