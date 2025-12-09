import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveChangeDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}