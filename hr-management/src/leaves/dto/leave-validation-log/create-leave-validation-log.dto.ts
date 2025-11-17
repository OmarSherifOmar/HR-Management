import { IsMongoId, IsEnum, IsBoolean, IsArray, IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationType } from '../../models/leave-validation-log.schema';

export class CreateLeaveValidationLogDto {
  @IsMongoId()
  leaveRequestId: string;

  @IsEnum(ValidationType)
  validationType: ValidationType;

  @IsBoolean()
  passed: boolean;

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
