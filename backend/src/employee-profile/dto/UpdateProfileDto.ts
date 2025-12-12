import { IsString, IsOptional } from 'class-validator';
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  biography?: string;

  // profilePicture handled as multipart file -> controller will supply profilePictureUrl to service
}