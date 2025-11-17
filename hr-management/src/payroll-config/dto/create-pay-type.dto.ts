import { PayTypeStatus } from '../models/pay-type.schema';

export class CreatePayTypeDto {
  code: string;
  name: string;
  taxable: boolean;
  status: PayTypeStatus;
}