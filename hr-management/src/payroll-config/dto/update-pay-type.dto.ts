import { PayTypeStatus } from '../models/pay-type.schema';

export class UpdatePayTypeDto {
  code?: string;
  name?: string;
  taxable?: boolean;
  status?: PayTypeStatus;
}