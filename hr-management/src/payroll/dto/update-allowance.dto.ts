import type { AllowanceCalcType } from './create-allowance.dto';

export class UpdateAllowanceDto {
  code?: string;
  name?: string;
  calcType?: AllowanceCalcType;
  value?: number;
  taxable?: boolean;
}