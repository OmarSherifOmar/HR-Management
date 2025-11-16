import { IsMongoId, IsEnum, IsBoolean, IsArray, IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationType } from '../../models/leave-validation-log.schema';

export class UpdateLeaveValidationLogDto {
  @IsOptional()
  @IsMongoId()
  leaveRequestId?: string;

  @IsOptional()
  @IsEnum(ValidationType)
  validationType?: ValidationType;

  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validatedAt?: Date;
}
