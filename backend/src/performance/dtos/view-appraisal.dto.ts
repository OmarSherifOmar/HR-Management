import { IsString } from 'class-validator';

export class ViewAppraisalDto {
  @IsString()
  appraisalRecordId: string;

  @IsString()
  employeeId: string;
}
