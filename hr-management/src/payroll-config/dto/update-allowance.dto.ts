import { AllowanceCalcType } from '../models/allowance.schema';

export class UpdateAllowanceDto {
  code?: string;
  name?: string;
  calcType?: AllowanceCalcType;
  value?: number;
  taxable?: boolean;
}
