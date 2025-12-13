import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateApplicationStatusHistoryDto {
  @IsMongoId()
  applicationId: string;

  @IsString()
  @IsOptional()
  oldStage?: string;

  @IsString()
  @IsOptional()
  newStage?: string;

  @IsString()
  @IsOptional()
  oldStatus?: string;

  @IsString()
  @IsOptional()
  newStatus?: string;

  @IsMongoId()
  changedBy: string;
}