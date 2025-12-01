import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class ClockRequestDto {
  @IsMongoId()
  employeeId!: string;

  @IsOptional()
  @IsString()
  time?: string; // ISO date string
}
