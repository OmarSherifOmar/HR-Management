import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TerminationStatus } from '../enums/termination-status.enum';

export class UpdateTerminationRequestDto {
  @IsEnum(TerminationStatus)
  @IsOptional()
  status?: TerminationStatus;

  @IsString()
  @IsOptional()
  hrComments?: string;

  @IsString()
  @IsOptional()
  employeeComments?: string;

  @IsDateString()
  @IsOptional()
  terminationDate?: Date;
}

