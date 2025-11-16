import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';

export class UpdateFinalAppraisalDto {
  @IsOptional() 
  @IsNumber() 
  score?: number;
  @IsOptional() 
  @IsString() 
  ratingScale?: string;
  @IsOptional() 
  @IsString() 
  method?: string;
  @IsOptional() 
  @IsDateString() 
  finalizedAt?: string;
}
