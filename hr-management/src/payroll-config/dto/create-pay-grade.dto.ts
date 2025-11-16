export class CreatePayGradeDto {
  code: string;
  title: string;
  grossMonthly: number;
  allowedPayTypes: string[];
}