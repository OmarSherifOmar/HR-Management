import { IsOptional, IsString, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { OffboardingType, OffboardingStatus } from '../schemas/offboarding-request.schema';

/**
 * DTO for updating an offboarding request
 */
export class UpdateOffboardingRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(OffboardingType)
  type?: OffboardingType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @IsOptional()
  @IsEnum(OffboardingStatus)
  status?: OffboardingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

