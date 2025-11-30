import { 
    IsString, IsArray, IsOptional, IsDate, IsEnum, IsMongoId 
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { InterviewMethod } from '../enums/interview-method.enum';
  import { InterviewStatus } from '../enums/interview-status.enum';
  import { ApplicationStage } from '../enums/application-stage.enum';
  
  export class CreateInterviewDto {
    @IsMongoId()
    applicationId: string;
  
    @IsEnum(ApplicationStage)
    stage: ApplicationStage;
  
    @IsDate()
    @Type(() => Date)
    scheduledDate: Date;
  
    @IsEnum(InterviewMethod)
    method: InterviewMethod;
  
    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    panel?: string[];
  
    @IsString()
    @IsOptional()
    calendarEventId?: string;
  
    @IsString()
    @IsOptional()
    videoLink?: string;
  
    @IsEnum(InterviewStatus)
    @IsOptional()
    status?: InterviewStatus;
  
    @IsMongoId()
    @IsOptional()
    feedbackId?: string;
  
    @IsString()
    @IsOptional()
    candidateFeedback?: string;
  }
  
  export class UpdateInterviewDto {
    @IsEnum(ApplicationStage)
    @IsOptional()
    stage?: ApplicationStage;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    scheduledDate?: Date;
  
    @IsEnum(InterviewMethod)
    @IsOptional()
    method?: InterviewMethod;
  
    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    panel?: string[];
  
    @IsString()
    @IsOptional()
    calendarEventId?: string;
  
    @IsString()
    @IsOptional()
    videoLink?: string;
  
    @IsEnum(InterviewStatus)
    @IsOptional()
    status?: InterviewStatus;
  
    @IsMongoId()
    @IsOptional()
    feedbackId?: string;
  
    @IsString()
    @IsOptional()
    candidateFeedback?: string;
  }