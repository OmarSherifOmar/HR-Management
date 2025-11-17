import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSeparationBenefitDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['FIXED', 'PER_YEAR'])
  formula?: 'FIXED' | 'PER_YEAR';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  value?: number;
}

export default UpdateSeparationBenefitDto;
