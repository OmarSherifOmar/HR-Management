import { IsNotEmpty, IsString } from 'class-validator';

export class ManagerRejectDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsNotEmpty()
  @IsString()
  managerId: string;

  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

