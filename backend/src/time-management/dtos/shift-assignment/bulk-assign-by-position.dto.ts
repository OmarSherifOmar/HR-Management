import { IsMongoId, IsDateString, IsOptional, IsString } from 'class-validator';

export class BulkAssignByPositionDto {
  @IsMongoId()
  positionId: string;

  @IsMongoId()
  shiftId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string; // null means ongoing

  @IsOptional()
  @IsString()
  notes?: string;
}