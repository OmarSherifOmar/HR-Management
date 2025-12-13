import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePayTypeDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @Min(6000)
  amount: number;
}
