import { IsArray, IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateAppraisalFormDto {
  @IsArray()
  ratings: {
    itemId: string;
    rating: number;
    comment?: string;
    example?: string;
    developmentRecommendation?: string;
  }[];
}
