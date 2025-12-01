import { IsDateString, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateTerminationRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  initiator: string; // 'hr' or 'manager'

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  hrComments?: string;

  @IsDateString()
  @IsNotEmpty()
  terminationDate: Date;

  @IsMongoId()
  @IsNotEmpty()
  contractId: string;
}

