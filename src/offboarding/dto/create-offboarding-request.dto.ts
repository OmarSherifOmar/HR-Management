import { IsNotEmpty, IsString, IsEnum, IsDate, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { OffboardingType } from '../enums';

/**
 * DTO for creating an offboarding request
 */
export class CreateOffboardingRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsEnum(OffboardingType)
  type: OffboardingType;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  submittedBy?: string;
}

