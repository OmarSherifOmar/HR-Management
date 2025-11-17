import { IsMongoId, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateEmployeeAppraisalHistoryDto {
  @IsMongoId() 
  employee: string;
  @IsMongoId() 
  appraisalRecord: string;
  @IsNumber() 
  cycleYear: number;
  @IsNumber() 
  score: number;
  @IsString() 
  ratingScale: string;
  @IsString() 
  method: string;
}
