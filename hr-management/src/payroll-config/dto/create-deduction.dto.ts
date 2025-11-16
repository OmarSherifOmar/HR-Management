import { DeductionCalcType } from '../models/deduction.schema';

export class CreateDeductionDto {
  code: string;
  name: string;
  calcType: DeductionCalcType;
  value: number;
}
