import { IsMongoId, IsDate, IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DelegationStatus } from '../../models/delegation.schema';

export class CreateDelegationDto {
  @IsMongoId()
  managerId: string;

  @IsMongoId()
  delegateId: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsEnum(DelegationStatus)
  status: DelegationStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsMongoId()
  createdBy: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
