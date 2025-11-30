import { IsEnum, IsOptional } from 'class-validator';
import { OffboardingStatus } from '../enums/offboarding-status.enum';

export class UpdateOffboardingProcessDto {
  @IsEnum(OffboardingStatus)
  @IsOptional()
  status?: OffboardingStatus;
}

