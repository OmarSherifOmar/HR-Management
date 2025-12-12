import { IsString, IsOptional, IsArray } from 'class-validator';

export class SendReminderDto {
  @IsString()
  cycleId: string;

  @IsString()
  reminderType: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsString()
  customMessage?: string;
}
