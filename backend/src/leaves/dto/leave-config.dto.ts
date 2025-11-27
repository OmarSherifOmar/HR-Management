import { Types } from 'mongoose';

// Leave Policy Configuration DTOs
export class CreateLeavePolicyDto {
  leaveTypeId!: Types.ObjectId;
  accrualMethod!: string;
  monthlyRate?: number;
  yearlyRate?: number;
  carryForwardAllowed?: boolean;
  maxCarryForward?: number;
  expiryAfterMonths?: number;
  roundingRule?: string;
  minNoticeDays?: number;
  maxConsecutiveDays?: number;
  eligibility?: {
    minTenureMonths?: number;
    positionsAllowed?: string[];
    contractTypesAllowed?: string[];
  };
}

export class UpdateLeavePolicyDto {
  accrualMethod?: string;
  monthlyRate?: number;
  yearlyRate?: number;
  carryForwardAllowed?: boolean;
  maxCarryForward?: number;
  expiryAfterMonths?: number;
  roundingRule?: string;
  minNoticeDays?: number;
  maxConsecutiveDays?: number;
  eligibility?: {
    minTenureMonths?: number;
    positionsAllowed?: string[];
    contractTypesAllowed?: string[];
  };
}

// Leave Type DTOs
export class CreateLeaveTypeDto {
  code!: string;
  name!: string;
  categoryId!: Types.ObjectId;
  description?: string;
  paid?: boolean;
  deductible?: boolean;
  requiresAttachment?: boolean;
  attachmentType?: string;
  minTenureMonths?: number;
  maxDurationDays?: number;
}

export class UpdateLeaveTypeDto {
  name?: string;
  categoryId?: Types.ObjectId;
  description?: string;
  paid?: boolean;
  deductible?: boolean;
  requiresAttachment?: boolean;
  attachmentType?: string;
  minTenureMonths?: number;
  maxDurationDays?: number;
}

// Leave Category DTOs
export class CreateLeaveCategoryDto {
  name!: string;
  code!: string;
  description?: string;
  isActive?: boolean;
}

export class UpdateLeaveCategoryDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Calendar DTOs
export class CreateHolidayDto {
  name!: string;
  date!: Date;
  type!: string;
  description?: string;
  applicableDepartments?: Types.ObjectId[];
  applicablePositions?: Types.ObjectId[];
  isRecurring?: boolean;
}

export class UpdateHolidayDto {
  name?: string;
  date?: Date;
  type?: string;
  description?: string;
  applicableDepartments?: Types.ObjectId[];
  applicablePositions?: Types.ObjectId[];
  isRecurring?: boolean;
}
