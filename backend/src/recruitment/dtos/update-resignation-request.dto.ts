import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ResignationStatus } from '../enums/resignation-status.enum';

export class UpdateResignationRequestDto {
  @IsEnum(ResignationStatus)
  @IsOptional()
  status?: ResignationStatus;

  @IsString()
  @IsOptional()
  reviewComments?: string;

  @IsDateString()
  @IsOptional()
  actualLastWorkingDay?: Date;
}

