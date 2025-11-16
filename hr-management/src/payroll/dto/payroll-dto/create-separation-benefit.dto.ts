export type SeparationFormula = 'FIXED' | 'PER_YEAR';

export class CreateSeparationBenefitDto {
  code: string;
  name: string;
  formula: SeparationFormula;
  value: number;
}