import { IsMongoId, IsNumber } from 'class-validator';

export class CreateAppraisalProgressDto {
  @IsMongoId()
  department: string;

  @IsNumber()
  totalEmployees: number;

  @IsNumber()
  completed: number;

  @IsNumber()
  completionRate: number;
}
