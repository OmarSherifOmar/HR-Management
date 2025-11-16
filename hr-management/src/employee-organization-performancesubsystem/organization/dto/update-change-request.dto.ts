import { IsEnum, IsOptional, IsString, IsMongoId } from 'class-validator';
import { ChangeRequestStatus } from '../models/change-request.schema';

export class UpdateChangeRequestDto {
  @IsEnum(ChangeRequestStatus)
  status: ChangeRequestStatus;

  @IsMongoId()
  reviewedBy: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
