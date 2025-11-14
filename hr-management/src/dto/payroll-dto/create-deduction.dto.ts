export type DeductionCalcType = 'FIXED' | 'PERCENT';

export class CreateDeductionDto {
  code: string;
  name: string;
  calcType: DeductionCalcType;
  value: number;
}