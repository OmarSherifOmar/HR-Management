export type AllowanceCalcType = 'FIXED' | 'PERCENT';

export class CreateAllowanceDto {
  code: string;
  name: string;
  calcType: AllowanceCalcType;
  value: number;
  taxable: boolean;
}