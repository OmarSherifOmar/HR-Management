import { IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

export class CreateApplicationDto {
  @IsMongoId()
  candidateId: string;

  @IsMongoId()
  requisitionId: string;

  @IsMongoId()
  @IsOptional()
  assignedHr?: string;

  @IsEnum(ApplicationStage)
  @IsOptional()
  currentStage?: ApplicationStage;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}

export class UpdateApplicationDto {
  @IsMongoId()
  @IsOptional()
  assignedHr?: string;

  @IsEnum(ApplicationStage)
  @IsOptional()
  currentStage?: ApplicationStage;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}