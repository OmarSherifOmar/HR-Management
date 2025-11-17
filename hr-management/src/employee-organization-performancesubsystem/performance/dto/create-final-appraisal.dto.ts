import { IsMongoId, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateFinalAppraisalDto {
  @IsMongoId() 
  employee: string;
  @IsMongoId()
  manager: string;
  @IsNumber()
  score: number;
  @IsString() 
  ratingScale: string;
  @IsString() 
  method: string;
  @IsOptional() 
  @IsDateString() 
  finalizedAt?: string;
}
