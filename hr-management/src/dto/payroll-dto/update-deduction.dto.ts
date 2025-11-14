import type { DeductionCalcType } from './create-deduction.dto';

export class UpdateDeductionDto {
  code?: string;
  name?: string;
  calcType?: DeductionCalcType;
  value?: number;
}