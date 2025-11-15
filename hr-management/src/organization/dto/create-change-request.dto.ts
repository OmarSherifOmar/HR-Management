import { IsEnum, IsMongoId, IsObject } from 'class-validator';
import { ChangeRequestType } from '../models/change-request.schema';

export class CreateChangeRequestDto {
  @IsEnum(ChangeRequestType)
  type: ChangeRequestType;

  @IsObject()
  payload: Record<string, any>;

  @IsMongoId()
  requestedBy: string;
}
