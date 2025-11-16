import type { SeparationFormula } from './create-separation-benefit.dto';

export class UpdateSeparationBenefitDto {
  code?: string;
  name?: string;
  formula?: SeparationFormula;
  value?: number;
}