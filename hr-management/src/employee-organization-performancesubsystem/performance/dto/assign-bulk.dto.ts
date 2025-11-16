import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class BulkAssignDto {
  @IsString() @IsNotEmpty() cycleId: string;
  @IsString() @IsNotEmpty() templateId: string;
  @IsArray() @IsOptional() employeeIds?: string[]; // specific employees
  @IsArray() @IsOptional() managerIds?: string[]; // specific managers (optional)
  @IsOptional() notify?: boolean;
}
