import { IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId()
  user: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsMongoId()
  relatedRequest?: string;
}
