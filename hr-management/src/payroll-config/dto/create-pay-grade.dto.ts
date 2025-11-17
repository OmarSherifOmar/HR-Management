import { PayGradeStatus } from '../models/pay-grade.schema';

export class CreatePayGradeDto {
  code: string;
  title: string;
  grossMonthly: number;
  allowedPayTypes: string[];
  status: PayGradeStatus;
}