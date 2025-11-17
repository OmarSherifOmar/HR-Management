// schedule.dto.ts
import { IsDate, IsMongoId, IsNumber, IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export enum ScheduleStatus {
  Active = 'Active',
  Expired = 'Expired',
}

export class CreateScheduleDto {
  @IsMongoId()
  employeeId: Types.ObjectId;

  @IsMongoId()
  shiftId: Types.ObjectId;

  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsArray()
  @IsNumber({}, { each: true })
  workingDays: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  restDays?: number[];

  @IsOptional()
  @IsBoolean()
  isRotational?: boolean;

  @IsOptional()
  @IsString()
  rotationPattern?: string;

  @IsOptional()
  @IsString()
  status?: ScheduleStatus;
}
