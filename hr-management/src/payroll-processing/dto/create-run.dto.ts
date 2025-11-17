import { IsDate, IsNotEmpty } from 'class-validator';

export class CreatePayrollRunDto {
  @IsDate()
  @IsNotEmpty()
  periodStart: Date;

  @IsDate()
  @IsNotEmpty()
  periodEnd: Date;
}
