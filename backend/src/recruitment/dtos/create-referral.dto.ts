import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReferralDto {
  @IsMongoId()
  @IsNotEmpty()
  referringEmployeeId: string;

  @IsMongoId()
  @IsNotEmpty()
  candidateId: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  level?: string;
}