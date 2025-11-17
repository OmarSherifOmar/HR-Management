import { IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export enum AttendanceStatus {
  Present = 'Present',
  Late = 'Late',
  Absent = 'Absent',
  OnLeave = 'OnLeave',
  MissingPunch = 'MissingPunch',
}

export class CreateAttendanceDto {
  @IsMongoId()
  employeeId: Types.ObjectId;

  @IsDate()
  date: Date;

  @IsOptional()
  @IsDate()
  clockIn?: Date;

  @IsOptional()
  @IsDate()
  clockOut?: Date;

  @IsOptional()
  @IsNumber()
  workedHours?: number;

  @IsOptional()
  @IsNumber()
  overtimeHours?: number;

  @IsOptional()
  @IsNumber()
  penalties?: number;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsMongoId()
  validatedBy?: Types.ObjectId;

  @IsOptional()
  @IsString()
  notes?: string;
}
