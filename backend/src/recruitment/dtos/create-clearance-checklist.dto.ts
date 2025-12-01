import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateClearanceChecklistDto {
  @IsMongoId()
  @IsNotEmpty()
  offboardingProcessId: string;

  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsArray()
  departmentSignoffs: any[];

  @IsArray()
  assets: any[];
}

