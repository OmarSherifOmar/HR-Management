import { IsString, IsDateString } from 'class-validator';

export class RenewShiftAssignmentDto {
  @IsString()
  assignmentId: string;

  @IsDateString()
  newEndDate: string;
}
