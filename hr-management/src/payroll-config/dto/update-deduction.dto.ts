import { DeductionCalcType } from '../models/deduction.schema';

export class UpdateDeductionDto {
  code?: string;
  name?: string;
  calcType?: DeductionCalcType;
  value?: number;
}
 