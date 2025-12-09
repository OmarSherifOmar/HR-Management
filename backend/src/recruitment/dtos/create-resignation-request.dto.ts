import { IsDateString, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateResignationRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  additionalComments?: string;

  @IsDateString()
  @IsNotEmpty()
  requestedLastWorkingDay: Date;

  @IsMongoId()
  @IsNotEmpty()
  contractId: string;
}

