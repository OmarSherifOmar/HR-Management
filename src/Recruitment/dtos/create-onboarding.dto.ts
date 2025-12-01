import { IsEmail, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateOnboardingDto {
  @IsNotEmpty()
  candidateName: string;

  @IsEmail()
  candidateEmail: string;

  @IsOptional()
  @IsArray()
  taskChecklist?: string[];

  @IsOptional()
  @IsArray()
  documentsCollected?: string[];

  @IsOptional()
  @IsBoolean()
  accessProvisioned?: boolean;

  @IsOptional()
  @IsBoolean()
  resourcesAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  payrollInitiated?: boolean;

  @IsOptional()
  @IsBoolean()
  benefitsInitiated?: boolean;
}