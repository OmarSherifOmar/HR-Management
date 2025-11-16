import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../models/notification-types.enum';

export class CreateNotificationDto {
  @IsMongoId()
  user: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsMongoId()
  relatedRequest?: string;
}
