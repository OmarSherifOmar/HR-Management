// update-contact.dto.ts
import { IsOptional, IsString, IsPhoneNumber } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  // or @IsPhoneNumber('ZZ') for stricter phone validation if you want
  readonly mobilePhone?: string;

  @IsOptional()
  @IsString()
  readonly address?: string;

  @IsOptional()
  @IsString()
  readonly personalEmail?: string;
  city: string;
  country: string;
}
