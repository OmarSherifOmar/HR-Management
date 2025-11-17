import { IsNotEmpty, IsEnum, IsOptional, IsMongoId, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum RequestType {
  Correction = 'Correction',
  Permission = 'Permission',
  Overtime = 'Overtime',
}

class RequestDetailsDto {
  @IsOptional()
  date?: Date;

  @IsOptional()
  startTime?: Date;

  @IsOptional()
  endTime?: Date;

  @IsOptional()
  @IsNumber()
  hoursRequested?: number;

  @IsOptional()
  reason?: string;
}

class AttachmentDto {
  @IsNotEmpty()
  filename: string;

  @IsNotEmpty()
  url: string;

  @IsOptional()
  uploadedAt?: Date;
}

export class CreateWorkflowDto {
  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @IsNotEmpty()
  @IsMongoId()
  requestedBy: string;

  @IsNotEmpty()
  @IsEnum(RequestType)
  requestType: RequestType;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RequestDetailsDto)
  requestDetails: RequestDetailsDto;

  @IsOptional()
  @IsMongoId()
  relatedAttendanceId?: string;

  @IsOptional()
  @IsMongoId()
  shiftId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
