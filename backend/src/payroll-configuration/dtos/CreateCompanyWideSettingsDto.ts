import { IsDateString, IsNotEmpty, IsString } from 'class-validator';


export class CreateCompanyWideSettingsDto {
  @IsDateString()
  @IsNotEmpty()
  payDate: string;  // store as ISO string


  @IsString()
  @IsNotEmpty()
  timeZone: string;

  @IsString()
  @IsNotEmpty()
  currency: string; 
}
