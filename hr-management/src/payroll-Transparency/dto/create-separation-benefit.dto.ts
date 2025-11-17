import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsString } from 'class-validator';

export class CreateSeparationBenefitDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsIn(['FIXED', 'PER_YEAR'])
  formula: 'FIXED' | 'PER_YEAR';

  @IsNumber()
  @Type(() => Number)
  value: number;
}

export default CreateSeparationBenefitDto;
