import { PayGradeStatus } from '../models/pay-grade.schema';

export class UpdatePayGradeDto {
  code?: string;
  title?: string;
  grossMonthly?: number;
  allowedPayTypes?: string[];
  status?: PayGradeStatus;
}