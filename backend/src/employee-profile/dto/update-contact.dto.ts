// update-contact.dto.ts
import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  readonly mobilePhone?: string;

  @IsOptional()
  @IsString()
  readonly address?: string;

  @IsOptional()
  @IsString()
  readonly city?: string;

  @IsOptional()
  @IsString()
  readonly country?: string;

  @IsOptional()
  @IsString()
  readonly homePhone?: string;

  @IsOptional()
  @IsString()
  readonly personalEmail?: string;
}

