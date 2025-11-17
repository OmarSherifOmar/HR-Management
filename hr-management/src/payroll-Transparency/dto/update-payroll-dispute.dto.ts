import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePayrollDisputeDto {
  @IsOptional()
  @IsEnum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED'])
  status?: string;

  @IsOptional()
  @IsString()
  specialistComment?: string;

  @IsOptional()
  @IsString()
  managerDecision?: string;
}
