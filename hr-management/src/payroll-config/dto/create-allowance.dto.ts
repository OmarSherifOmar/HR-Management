import { AllowanceCalcType } from '../models/allowance.schema';

export class CreateAllowanceDto {
  code: string;
  name: string;
  calcType: AllowanceCalcType;
  value: number;
  taxable: boolean;
}
  