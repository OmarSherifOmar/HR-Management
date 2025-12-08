import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCompanyWideSettingsDto {
  @IsDateString()
  @IsNotEmpty()
  payDate: string;

  @IsString()
  @IsNotEmpty()
  timeZone: string;

  @IsString()
  @IsNotEmpty()
  currency: string;
}
