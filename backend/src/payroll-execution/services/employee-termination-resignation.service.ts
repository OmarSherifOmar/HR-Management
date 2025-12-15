import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeTerminationResignation } from '../models/EmployeeTerminationResignation.schema';
import { EmployeeTerminationResignationEditDto } from '../dto/EmployeeTerminationResignationEdit.dto';
import { EmployeeTerminationResignationApproveDto } from '../dto/EmployeeTerminationResignationApprove.dto';
import { EmployeeTerminationResignationRejectDto } from '../dto/EmployeeTerminationResignationReject.dto';

@Injectable()
export class EmployeeTerminationResignationService {
  constructor(
    @InjectModel(EmployeeTerminationResignation.name)
    private readonly terminationResignationModel: Model<EmployeeTerminationResignation>,
  ) {}

  /**
   * Auto-process termination benefits for a payroll run
   * Fetches all terminated employees and calculates benefits according to business rules
   */
  async autoProcessTerminationBenefits(runId: string) {
    const { Types } = require('mongoose');
    console.log('DEBUG: Searching for payrollRunId:', runId, 'as ObjectId:', new Types.ObjectId(runId));
    const pendingBenefits = await this.terminationResignationModel.find({
      status: 'pending',
      payrollRunId: new Types.ObjectId(runId),
    });

    if (pendingBenefits.length === 0) {
      return {
        message: 'No pending termination/resignation benefits found for this payroll run',
        count: 0,
      };
    }

    // Mark benefits as auto-processed
    await this.terminationResignationModel.updateMany(
      { status: 'pending', payrollRunId: runId },
      { 
        status: 'auto_processed',
        processedAt: new Date(),
      }
    );

    return {
      message: `Successfully auto-processed ${pendingBenefits.length} termination/resignation benefits`,
      count: pendingBenefits.length,
      benefits: pendingBenefits,
    };
  }

  /**
   * Auto-process resignation benefits for a payroll run
   * Fetches all resigned employees and calculates benefits according to business rules
   */
  async autoProcessResignationBenefits(runId: string) {
    const pendingBenefits = await this.terminationResignationModel.find({
      status: 'pending',
      payrollRunId: runId,
    });

    if (pendingBenefits.length === 0) {
      return {
        message: 'No pending benefits found for this payroll run',
        count: 0,
      };
    }

    // Mark benefits as auto-processed
    await this.terminationResignationModel.updateMany(
      { status: 'pending', payrollRunId: runId },
      { 
        status: 'auto_processed',
        processedAt: new Date(),
      }
    );

    return {
      message: `Successfully auto-processed ${pendingBenefits.length} benefits`,
      count: pendingBenefits.length,
      benefits: pendingBenefits,
    };
  }

  /**
   * Manual edit of termination/resignation benefit
   * Allows payroll specialist to modify benefit details before approval
   */
  async editBenefit(dto: EmployeeTerminationResignationEditDto, editorId: string) {
    const benefit = await this.terminationResignationModel.findById(dto.benefitId);

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${dto.benefitId} not found`);
    }

    if (benefit.status === 'approved' || benefit.status === 'rejected') {
      throw new BadRequestException(
        `Cannot edit benefit with status: ${benefit.status}`
      );
    }

    const updateData: any = {
      lastEditedBy: editorId,
      lastEditedAt: new Date(),
    };

    if (dto.adjustedAmount !== undefined) {
      updateData.benefitAmount = dto.adjustedAmount;
      updateData.originalAmount = benefit.get('benefitAmount'); // Store original
    }

    if (dto.editReason) {
      updateData.editReason = dto.editReason;
    }

    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    const updatedBenefit = await this.terminationResignationModel.findByIdAndUpdate(
      dto.benefitId,
      updateData,
      { new: true }
    );

    return {
      message: 'Benefit updated successfully',
      benefit: updatedBenefit,
    };
  }

  /**
   * Review termination/resignation benefit details
   * Retrieves benefit information for review before approval/rejection
   */
  async reviewBenefit(benefitId: string, reviewerId: string) {
    const benefit = await this.terminationResignationModel
      .findById(benefitId)
      .populate('employeeId', 'name email position department');

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${benefitId} not found`);
    }

    // Log review activity
    await this.terminationResignationModel.findByIdAndUpdate(benefitId, {
      $push: {
        reviewHistory: {
          reviewerId,
          reviewedAt: new Date(),
          action: 'reviewed',
        },
      },
    });

    return {
      message: 'Benefit retrieved for review',
      benefit,
    };
  }

  /**
   * Approve termination/resignation benefit
   * Marks benefit as approved and ready for payroll processing
   */
  async approveBenefit(dto: EmployeeTerminationResignationApproveDto, approverId: string) {
    const benefit = await this.terminationResignationModel.findById(dto.benefitId);

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${dto.benefitId} not found`);
    }

    if (benefit.status === 'approved') {
      throw new BadRequestException('Benefit is already approved');
    }

    if (benefit.status === 'rejected') {
      throw new BadRequestException('Cannot approve a rejected benefit');
    }

    const updateData: any = {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      approverComments: dto.approverComments,
    };

    // If approver adjusted the amount during approval
    if (dto.adjustedAmount !== undefined && dto.adjustedAmount !== benefit.get('benefitAmount')) {
      updateData.benefitAmount = dto.adjustedAmount;
      updateData.originalAmount = benefit.get('benefitAmount');
    }

    const approvedBenefit = await this.terminationResignationModel.findByIdAndUpdate(
      dto.benefitId,
      updateData,
      { new: true }
    );

    return {
      message: 'Benefit approved successfully',
      benefit: approvedBenefit,
    };
  }

  /**
   * Reject termination/resignation benefit
   * Marks benefit as rejected with reason, excludes from payroll processing
   */
  async rejectBenefit(dto: EmployeeTerminationResignationRejectDto, approverId: string) {
    const benefit = await this.terminationResignationModel.findById(dto.benefitId);

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${dto.benefitId} not found`);
    }

    if (benefit.status === 'approved') {
      throw new BadRequestException('Cannot reject an already approved benefit');
    }

    if (benefit.status === 'rejected') {
      throw new BadRequestException('Benefit is already rejected');
    }

    const rejectedBenefit = await this.terminationResignationModel.findByIdAndUpdate(
      dto.benefitId,
      {
        status: 'rejected',
        rejectedBy: approverId,
        rejectedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
      { new: true }
    );

    return {
      message: 'Benefit rejected successfully',
      benefit: rejectedBenefit,
    };
  }

  /**
   * Get all termination benefits for a payroll run
   */
  async getTerminationBenefitsByRun(runId: string) {
    const { Types } = require('mongoose');
    const benefits = await this.terminationResignationModel
      .find({ payrollRunId: new Types.ObjectId(runId) })
      .populate('employeeId', 'name email position department');

    return {
      count: benefits.length,
      benefits,
    };
  }

  /**
   * Get all resignation benefits for a payroll run
   */
  async getResignationBenefitsByRun(runId: string) {
    const benefits = await this.terminationResignationModel
      .find({ payrollRunId: runId })
      .populate('employeeId', 'name email position department');

    return {
      count: benefits.length,
      benefits,
    };
  }

  /**
   * Get pending benefits requiring approval
   */
  async getPendingBenefits() {
    const query: any = { status: { $in: ['pending', 'auto_processed'] } };

    const pendingBenefits = await this.terminationResignationModel
      .find(query)
      .populate('employeeId', 'name email position department')
      .sort({ createdAt: -1 });

    return {
      count: pendingBenefits.length,
      benefits: pendingBenefits,
    };
  }
}
