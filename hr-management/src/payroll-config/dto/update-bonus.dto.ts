import { BonusStatus } from '../models/bonus.schema';

export class UpdateBonusDto {
  code?: string;
  name?: string;
  amount?: number;
  status?: BonusStatus;
}