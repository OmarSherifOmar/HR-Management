import { IsString, IsOptional } from 'class-validator';
export class CorrectionRequestDto {
  @IsString()
  field: string; 

  @IsString()
  currentValue: string;

  @IsString()
  requestedValue: string;

  @IsOptional()
  @IsString()
  reason?: string;
}