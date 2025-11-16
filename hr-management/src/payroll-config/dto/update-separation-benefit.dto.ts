import { SeparationFormula } from '../models/separation-benefit.schema';

export class UpdateSeparationBenefitDto {
  code?: string;
  name?: string;
  formula?: SeparationFormula;
  value?: number;
}
