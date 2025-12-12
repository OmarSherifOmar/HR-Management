import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OffboardingProcess,
  OffboardingProcessDocument,
} from '../models/offboarding-process.schema';
import { CreateOffboardingProcessDto } from '../dtos/create-offboarding-process.dto';
import { UpdateOffboardingProcessDto } from '../dtos/update-offboarding-process.dto';
import { OffboardingStatus } from '../enums/offboarding-status.enum';
import { ClearanceChecklistService } from './clearance-checklist.service';
// TODO: Import TimeManagementService when available for access revocation
// import { TimeManagementService } from '../../time-management/time-management.service';
// TODO: Import PayrollExecutionService when available for final settlement
// import { PayrollExecutionService } from '../../payroll-execution/payroll-execution.service';

/**
 * Main Offboarding Process Service
 * Coordinates OFF-007 (Access Revocation) and OFF-013 (Final Settlement)
 */
@Injectable()
export class OffboardingProcessService {
  constructor(
    @InjectModel(OffboardingProcess.name)
    private readonly offboardingModel: Model<OffboardingProcessDocument>,
    private readonly clearanceService: ClearanceChecklistService,
    // TODO: Inject TimeManagementService when available
    // private readonly timeManagementService: TimeManagementService,
    // TODO: Inject PayrollExecutionService when available
    // private readonly payrollExecutionService: PayrollExecutionService,
  ) {}

  async create(
    dto: CreateOffboardingProcessDto,
  ): Promise<OffboardingProcessDocument> {
    const offboarding = new this.offboardingModel({
      ...dto,
      status: OffboardingStatus.INITIATED,
      accessRevoked: false,
      settlementTriggered: false,
    });

    return offboarding.save();
  }

  async findAll(): Promise<OffboardingProcessDocument[]> {
    return this.offboardingModel
      .find()
      .populate('employeeId')
      .populate('resignationRequestId')
      .populate('terminationRequestId')
      .populate('clearanceChecklistId')
      .populate('initiatedBy')
      .populate('accessRevokedBy')
      .exec();
  }

  async findOne(id: string): Promise<OffboardingProcessDocument> {
    const offboarding = await this.offboardingModel
      .findById(id)
      .populate('employeeId')
      .populate('resignationRequestId')
      .populate('terminationRequestId')
      .populate('clearanceChecklistId')
      .populate('initiatedBy')
      .populate('accessRevokedBy')
      .exec();

    if (!offboarding) {
      throw new NotFoundException(`Offboarding process with id "${id}" not found`);
    }

    return offboarding;
  }

  async findByEmployee(employeeId: string): Promise<OffboardingProcessDocument[]> {
    return this.offboardingModel
      .find({ employeeId })
      .populate('resignationRequestId')
      .populate('terminationRequestId')
      .populate('clearanceChecklistId')
      .populate('initiatedBy')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    dto: UpdateOffboardingProcessDto,
  ): Promise<OffboardingProcessDocument> {
    const updated = await this.offboardingModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('employeeId')
      .populate('resignationRequestId')
      .populate('terminationRequestId')
      .populate('clearanceChecklistId')
      .populate('initiatedBy')
      .populate('accessRevokedBy')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Offboarding process with id "${id}" not found`);
    }

    return updated;
  }

  /**
   * OFF-007: System Admin revokes system and account access upon termination
   * TODO: Integrate with TimeManagementService for actual access revocation
   */
  async revokeAccess(
    id: string,
    revokedBy: string,
  ): Promise<OffboardingProcessDocument> {
    const offboarding = await this.findOne(id);

    if (offboarding.accessRevoked) {
      throw new Error('Access already revoked for this offboarding process');
    }

    // TODO: Call TimeManagementService to revoke system access
    // Example implementation when TimeManagementService is ready:
    // await this.timeManagementService.revokeSystemAccess(
    //   offboarding.employeeId.toString(),
    //   revokedBy,
    // );

    // TODO: Verify access revocation through TimeManagementService
    // Example implementation when TimeManagementService is ready:
    // const verified = await this.timeManagementService.verifyAccessRevocation(
    //   offboarding.employeeId.toString(),
    // );
    // if (!verified) {
    //   throw new Error('Failed to verify access revocation');
    // }

    // For now, mark as revoked (ready for integration)
    console.log(`Access revocation requested for employee ${offboarding.employeeId} by ${revokedBy}`);

    // Update offboarding process
    offboarding.accessRevoked = true;
    offboarding.accessRevokedAt = new Date();
    offboarding.accessRevokedBy = revokedBy as any;
    offboarding.status = OffboardingStatus.ACCESS_REVOKED;

    return offboarding.save();
  }

  /**
   * OFF-013: HR Manager sends offboarding notification to trigger benefits termination and final pay calc
   * TODO: Integrate with PayrollExecutionService for actual settlement processing
   */
  async triggerFinalSettlement(
    id: string,
  ): Promise<OffboardingProcessDocument> {
    const offboarding = await this.findOne(id);

    if (offboarding.settlementTriggered) {
      throw new Error('Settlement already triggered for this offboarding process');
    }

    if (!offboarding.accessRevoked) {
      throw new Error('Access must be revoked before triggering final settlement');
    }

    // TODO: Call PayrollExecutionService to trigger benefits termination
    // Example implementation when PayrollExecutionService is ready:
    // await this.payrollExecutionService.triggerBenefitsTermination(
    //   offboarding.employeeId.toString(),
    //   offboarding.effectiveDate,
    // );

    // TODO: Call PayrollExecutionService to trigger final pay calculation
    // Example implementation when PayrollExecutionService is ready:
    // await this.payrollExecutionService.triggerFinalPayCalculation(
    //   offboarding.employeeId.toString(),
    // );

    // TODO: Call PayrollExecutionService to calculate final settlement
    // Example implementation when PayrollExecutionService is ready:
    // const settlement = await this.payrollExecutionService.calculateFinalSettlement(
    //   offboarding.employeeId.toString(),
    //   offboarding.effectiveDate,
    // );
    // console.log('Final settlement calculated:', settlement);

    // For now, log the trigger (ready for integration)
    console.log(`Final settlement triggered for employee ${offboarding.employeeId} with effective date ${offboarding.effectiveDate}`);

    // Update offboarding process
    offboarding.settlementTriggered = true;
    offboarding.settlementTriggeredAt = new Date();
    offboarding.status = OffboardingStatus.SETTLEMENT_TRIGGERED;

    return offboarding.save();
  }

  /**
   * Complete the offboarding process
   */
  async complete(id: string): Promise<OffboardingProcessDocument> {
    const offboarding = await this.findOne(id);

    // Verify all steps are completed
    if (!offboarding.accessRevoked) {
      throw new Error('Access must be revoked before completing offboarding');
    }

    if (!offboarding.settlementTriggered) {
      throw new Error('Settlement must be triggered before completing offboarding');
    }

    // Check clearance checklist if it exists
    if (offboarding.clearanceChecklistId) {
      const clearance = await this.clearanceService.findOne(
        offboarding.clearanceChecklistId.toString(),
      );

      if (!clearance.allAssetsReturned || !clearance.allSignoffsCompleted) {
        throw new Error('Clearance checklist must be completed before finishing offboarding');
      }
    }

    // Mark as completed
    offboarding.status = OffboardingStatus.COMPLETED;
    offboarding.completedAt = new Date();

    return offboarding.save();
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.offboardingModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Offboarding process with id "${id}" not found`);
    }
  }

  /**
   * Get offboarding process summary
   */
  async getOffboardingSummary(id: string): Promise<{
    process: OffboardingProcessDocument;
    clearanceStatus?: any;
    activeAccounts?: any[];
  }> {
    const process = await this.findOne(id);

    const result: any = { process };

    // Get clearance status if checklist exists
    if (process.clearanceChecklistId) {
      result.clearanceStatus = await this.clearanceService.getClearanceStatus(
        process.clearanceChecklistId.toString(),
      );
    }

    // TODO: Get active accounts from TimeManagementService if access not revoked
    // Example implementation when TimeManagementService is ready:
    // if (!process.accessRevoked) {
    //   result.activeAccounts = await this.timeManagementService.getActiveAccounts(
    //     process.employeeId.toString(),
    //   );
    // }

    return result;
  }
}
