import { IsMongoId, IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { AdjustmentType } from '../../enums/adjustment-type.enum';

export class CreateLeaveAdjustmentDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  @IsNumber()
  @Min(0.5)
  amount: number;

  @IsString()
  reason: string;

  @IsMongoId()
  hrUserId: string;
}
