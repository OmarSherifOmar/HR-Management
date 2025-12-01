import { IsString, IsNumber, IsOptional, IsDateString, IsMongoId, Min, IsArray } from 'class-validator';

// ==================== ACCRUAL SUSPENSION DTOs ====================

export class ProcessAccrualWithSuspensionDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}

export class BulkAccrualWithSuspensionDto {
  @IsMongoId()
  leaveTypeId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  employeeIds?: string[];
}

export class SuspendAccrualDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class ResumeAccrualDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CalculateServiceDaysDto {
  @IsMongoId()
  employeeId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}

export class PreviewAccrualAdjustmentDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}

// ==================== PAYROLL SYNC DTOs ====================

export class CalculateUnpaidDeductionDto {
  @IsMongoId()
  employeeId: string;

  @IsNumber()
  @Min(0)
  baseSalary: number;

  @IsNumber()
  @Min(1)
  month: number;

  @IsNumber()
  @Min(2020)
  year: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  workDaysInMonth?: number;
}

export class CalculateAbsenceDeductionDto {
  @IsMongoId()
  employeeId: string;

  @IsNumber()
  @Min(0)
  baseSalary: number;

  @IsNumber()
  @Min(0)
  absenceDays: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  workDaysInMonth?: number;
}

export class CalculateEncashmentDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsNumber()
  @Min(0.5)
  daysToEncash: number;

  @IsNumber()
  @Min(0)
  dailyRate: number;
}

export class ProcessEncashmentDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsNumber()
  @Min(0.5)
  daysToEncash: number;

  @IsNumber()
  @Min(0)
  dailyRate: number;
}

export class CalculateFinalSettlementDto {
  @IsMongoId()
  employeeId: string;

  @IsDateString()
  terminationDate: string;

  @IsNumber()
  @Min(0)
  dailyRate: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  encashableLeaveTypes?: string[];
}

export class ProcessFinalSettlementDto {
  @IsMongoId()
  employeeId: string;

  @IsDateString()
  terminationDate: string;

  @IsNumber()
  @Min(0)
  dailyRate: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  encashableLeaveTypes?: string[];
}

export class GetMonthlyPayrollSummaryDto {
  @IsNumber()
  @Min(1)
  month: number;

  @IsNumber()
  @Min(2020)
  year: number;

  // Map of employeeId to baseSalary - passed as object
  baseSalaryMap: Record<string, number>;
}

export class GenerateSyncEventDto {
  @IsMongoId()
  leaveRequestId: string;
}
