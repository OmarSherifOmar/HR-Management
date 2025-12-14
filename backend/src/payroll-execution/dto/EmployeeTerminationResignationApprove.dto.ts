import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class EmployeeTerminationResignationApproveDto {
  @IsString()
  benefitId: string;

  @IsString()
  approverComments: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  adjustedAmount?: number;
}
