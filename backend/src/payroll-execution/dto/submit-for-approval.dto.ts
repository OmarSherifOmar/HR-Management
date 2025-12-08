import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitForApprovalDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;
}

