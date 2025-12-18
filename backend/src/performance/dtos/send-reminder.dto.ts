import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum ReminderType {
  CYCLE_ENDING_SOON = 'CYCLE_ENDING_SOON',
  PENDING_ASSIGNMENT = 'PENDING_ASSIGNMENT',
  OVERDUE_ASSIGNMENT = 'OVERDUE_ASSIGNMENT',
}

export class SendReminderDto {
  @IsString()
  cycleId: string;

  @IsEnum(ReminderType)
  reminderType: ReminderType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsString()
  customMessage?: string;
}