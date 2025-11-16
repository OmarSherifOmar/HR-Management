import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { GovernedField } from '../models/governed-fields.enum';

export class RequestChangeDto {

  @IsEnum(GovernedField)
  field: GovernedField;

  @IsNotEmpty()
   to: any;
   
  @IsOptional()
  @IsString()
  reason?: string;
}
