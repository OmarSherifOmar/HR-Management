import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAssessmentResultDto {
  @IsMongoId()
  @IsNotEmpty()
  interviewId: string;

  @IsMongoId()
  @IsNotEmpty()
  interviewerId: string;

  @IsNumber()
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsOptional()
  comments?: string;
}