import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RatingEntryDto {
  @IsString()
  key: string;

  @IsString()
  title: string;

  @IsNumber()
  ratingValue: number;

  @IsOptional()
  @IsString()
  ratingLabel?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class SubmitAppraisalDto {
  @IsString()
  assignmentId: string;

  @IsString()
  managerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingEntryDto)
  ratings: RatingEntryDto[];

  @IsOptional()
  @IsString()
  managerSummary?: string;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  improvementAreas?: string;
}

export class SubmitAndPublishDto {
  @IsString()
  assignmentId: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingEntryDto)
  ratings: RatingEntryDto[];

  @IsOptional()
  @IsString()
  managerSummary?: string;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  improvementAreas?: string;
}

export class PublishAppraisalDto {
  @IsString()
  recordId: string;

  @IsString()
  publishedByEmployeeId: string;
}

export class BulkPublishDto {
  @IsString()
  cycleId: string;

  @IsString()
  publishedByEmployeeId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeRecordIds?: string[];
}
export class AcknowledgeAppraisalDto {
  @IsString()
  recordId: string;

  @IsOptional()
  @IsString()
  acknowledgedByEmployeeId?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}