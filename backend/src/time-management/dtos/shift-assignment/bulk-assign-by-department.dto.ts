import { IsString, IsDateString } from 'class-validator';

export class BulkAssignByDepartmentDto {
  @IsString()
  departmentId: string;

  @IsString()
  shiftId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
