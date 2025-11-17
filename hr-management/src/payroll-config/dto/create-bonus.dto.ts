import { BonusStatus } from '../models/bonus.schema';

export class CreateBonusDto {
  code: string;
  name: string;
  amount: number;
  status: BonusStatus;
}