import { IsDateString, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOffboardingProcessDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  initiationType: string; // 'employee', 'hr', 'manager'

  @IsMongoId()
  @IsOptional()
  resignationRequestId?: string;

  @IsMongoId()
  @IsOptional()
  terminationRequestId?: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveDate: Date;

  @IsMongoId()
  @IsNotEmpty()
  initiatedBy: string;
}

