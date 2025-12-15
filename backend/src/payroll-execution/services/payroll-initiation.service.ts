import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { payrollRuns } from '../models/payrollRuns.schema';
import { EditPayrollInitiationDto } from '../dto/edit-payroll-initiation.dto';
import { InitiatePayrollDto } from '../dto/initiate-payroll.dto';
import { ValidatePeriodDto } from '../dto/validate-period.dto';

@Injectable()
export class PayrollInitiationService {
  constructor(
    @InjectModel(payrollRuns.name)
    private readonly payrollRunsModel: Model<payrollRuns>,
  ) {}

  /**
   * Validate payroll period before initiation
   * Checks for overlapping periods, valid dates, and business rules
   */
  async validatePayrollPeriod(dto: ValidatePeriodDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Validation 1: End date must be after start date
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validation 2: Period length must match payroll type
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dto.payPeriodType === 'Weekly' && daysDiff !== 7) {
      throw new BadRequestException('Weekly payroll must be exactly 7 days');
    }
    
    if (dto.payPeriodType === 'Bi-Weekly' && daysDiff !== 14) {
      throw new BadRequestException('Bi-weekly payroll must be exactly 14 days');
    }
    
    if (dto.payPeriodType === 'Monthly' && (daysDiff < 28 || daysDiff > 31)) {
      throw new BadRequestException('Monthly payroll must be between 28-31 days');
    }

    // Validation 3: Check for overlapping payroll periods
    const overlappingRun = await this.payrollRunsModel.findOne({
      payrollPeriod: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled', 'deleted'] },
    });

    if (overlappingRun) {
      throw new ConflictException(
        `Overlapping payroll period found: ${overlappingRun.payrollPeriod.toISOString()}`
      );
    }

    // Validation 4: Cannot create payroll for future periods (more than 7 days ahead)
    const today = new Date();
    const maxFutureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (startDate > maxFutureDate) {
      throw new BadRequestException('Cannot create payroll more than 7 days in advance');
    }

    return {
      valid: true,
      message: 'Payroll period is valid and ready for initiation',
      periodDetails: {
        startDate,
        endDate,
        duration: daysDiff,
        payPeriodType: dto.payPeriodType,
      },
    };
  }



  /**
   * Get payroll run status
   * Retrieves current status and details of a payroll run
   */
  async getPayrollRunStatus(runId: string) {
    const run = await this.payrollRunsModel.findById(runId);

    if (!run) {
      throw new NotFoundException(`Payroll run with ID ${runId} not found`);
    }

    return {
      runId: run.runId,
      status: run.status,
      payrollPeriod: run.payrollPeriod,
      entity: run.entity,
      totalEmployees: run.employees,
      exceptions: run.exceptions,
      totalNetPay: run.totalnetpay,
      paymentStatus: run.paymentStatus,
      payrollSpecialistId: run.payrollSpecialistId,
      payrollManagerId: run.payrollManagerId,
      financeStaffId: run.financeStaffId,
    };
  }

  /**
   * Edit payroll initiation details
   * Allows modification of payroll period before processing begins
   */
  async editPayrollInitiation(dto: EditPayrollInitiationDto, editorId: string) {
    const run = await this.payrollRunsModel.findById(dto.runId);

    if (!run) {
      throw new NotFoundException(`Payroll run with ID ${dto.runId} not found`);
    }

    // Can only edit if status is 'draft'
    if (run.status !== 'draft') {
      throw new BadRequestException(
        `Cannot edit payroll run with status: ${run.status}. Only draft runs can be edited.`
      );
    }

    const updateData: any = {};

    
      // Validate new period
     

    const updatedRun = await this.payrollRunsModel.findByIdAndUpdate(
      dto.runId,
      updateData,
      { new: true }
    );

    return {
      message: 'Payroll initiation updated successfully',
      run: updatedRun,
    };
  }

  /**
   * Start automatic processing of payroll initiation
   * Triggers Phase 0 (bonus/benefit approvals) and prepares for Phase 1
   */
  async startAutomaticProcessing(runId: string, initiatorId: string) {
    const run = await this.payrollRunsModel.findById(runId);

    if (!run) {
      throw new NotFoundException(`Payroll run with ID ${runId} not found`);
    }

    if (run.status !== 'draft') {
      throw new BadRequestException(
        `Cannot start processing. Current status: ${run.status}`
      );
    }

    // Update status to processing
    const updatedRun = await this.payrollRunsModel.findByIdAndUpdate(
      runId,
      {
        status: 'in_progress',
      },
      { new: true }
    );

    return {
      message: 'Automatic payroll processing started',
      run: updatedRun,
      nextSteps: [
        'System will auto-process signing bonuses',
        'System will auto-process termination benefits',
        'System will auto-process resignation benefits',
        'Review and approve all benefits before proceeding to Phase 1',
      ],
    };
  }

  /**
   * Get all payroll runs with optional filtering
   */
  async getAllPayrollRuns(status?: string) {
    const query: any = {};
    
    if (status) query.status = status;

    const runs = await this.payrollRunsModel
      .find(query)
      .sort({ createdAt: -1 });

    return {
      count: runs.length,
      runs,
    };
  }

  /**
   * Delete/Cancel payroll run
   * Can only delete runs that haven't been locked or published
   */
  async deletePayrollRun(runId: string, deleterId: string) {
    const run = await this.payrollRunsModel.findById(runId);

    if (!run) {
      throw new NotFoundException(`Payroll run with ID ${runId} not found`);
    }

    if (['approved', 'published', 'paid'].includes(run.status)) {
      throw new BadRequestException(
        `Cannot delete payroll run with status: ${run.status}`
      );
    }

    await this.payrollRunsModel.findByIdAndDelete(runId);

    return {
      message: 'Payroll run deleted successfully',
    };
  }
}
