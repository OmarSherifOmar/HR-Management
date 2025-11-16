import { IsMongoId, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateAppraisalDisputeDto {
  @IsMongoId()
  employee: string;

  @IsMongoId()
  appraisalRecord: string;

  @IsString()
  reason: string;

}
