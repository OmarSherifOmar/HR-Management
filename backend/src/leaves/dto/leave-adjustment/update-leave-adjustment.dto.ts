import { IsMongoId, IsOptional, IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { AdjustmentType } from '../../enums/adjustment-type.enum';

export class UpdateLeaveAdjustmentDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsEnum(AdjustmentType)
  adjustmentType?: AdjustmentType;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsMongoId()
  hrUserId?: string;
}
