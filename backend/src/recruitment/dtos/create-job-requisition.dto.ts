import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsDateString, Min } from 'class-validator';

export class CreateJobRequisitionDto {
  @IsString()
  @IsNotEmpty()
  requisitionId: string;

  @IsMongoId()
  @IsOptional()
  templateId?: string;

  @IsNumber()
  @Min(1)
  openings: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsMongoId()
  @IsNotEmpty()
  hiringManagerId: string;

  @IsEnum(['draft', 'published', 'closed'])
  @IsOptional()
  publishStatus?: string;

  @IsDateString()
  @IsOptional()
  postingDate?: Date;

  @IsDateString()
  @IsOptional()
  expiryDate?: Date;
}