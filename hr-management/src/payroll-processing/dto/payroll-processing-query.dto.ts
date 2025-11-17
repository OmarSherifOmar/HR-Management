import { IsOptional, IsString } from 'class-validator';

export class PayrollProcessingQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  format?: string;

  @IsString()
  @IsOptional()
  bankName?: string;
}
