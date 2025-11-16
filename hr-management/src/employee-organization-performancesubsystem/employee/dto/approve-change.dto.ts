import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';


export class ApproveChangeDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsOptional()
  @IsBoolean() 
  approve?: boolean = true;

  @IsOptional()
  @IsString()
  reason?: string;
}
