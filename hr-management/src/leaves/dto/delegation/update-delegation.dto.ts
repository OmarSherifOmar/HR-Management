import { IsMongoId, IsDate, IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DelegationStatus } from '../../models/delegation.schema';

export class UpdateDelegationDto {
  @IsOptional()
  @IsMongoId()
  managerId?: string;

  @IsOptional()
  @IsMongoId()
  delegateId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(DelegationStatus)
  status?: DelegationStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
