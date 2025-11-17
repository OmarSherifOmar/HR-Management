import { SeparationFormula, SeparationBenefitStatus } from '../models/separation-benefit.schema';

export class CreateSeparationBenefitDto {
  code: string;
  name: string;
  formula: SeparationFormula;
  value: number;
  status: SeparationBenefitStatus;
}