import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DisputeStatus } from '../enums/payroll-tracking-enum';

export class UpdateDisputeDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
