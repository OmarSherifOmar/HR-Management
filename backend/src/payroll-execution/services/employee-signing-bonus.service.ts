import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { employeeSigningBonus } from '../models/EmployeeSigningBonus.schema';
import { EditSigningBonusDto } from '../dto/EmployeeSigningBonusEdit.dto';
import { ApproveSigningBonusDto } from '../dto/EmployeeSigningBonusApprove.dto';
import { RejectSigningBonusDto } from '../dto/EmployeeSigningBonusReject.dto';

@Injectable()
export class EmployeeSigningBonusService {
  constructor(
    @InjectModel(employeeSigningBonus.name)
    private readonly signingBonusModel: Model<employeeSigningBonus>,
  ) { }

  /**
   * Create a new signing bonus record
   * Used by HR/Payroll to manually add signing bonuses
   */
  async createSigningBonus(dto: any, creatorId: string) {
    // Validate employee exists
    const employeeExists = await this.signingBonusModel.db.collection('employee_profiles').findOne({
      _id: new Types.ObjectId(dto.employeeId)
    });

    if (!employeeExists) {
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    // Find or create a default signing bonus configuration for manual entries
    let signingBonusConfigId = dto.signingBonusId;

    if (!signingBonusConfigId) {
      let defaultConfig = await this.signingBonusModel.db.collection('signingbonuses').findOne({
        positionName: 'Manual Entry'
      });

      if (!defaultConfig) {
        const newConfig = await this.signingBonusModel.db.collection('signingbonuses').insertOne({
          positionName: 'Manual Entry',
          amount: dto.givenAmount || 0,
          status: 'approved',
          createdBy: new Types.ObjectId(creatorId),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        signingBonusConfigId = newConfig.insertedId;
      } else {
        signingBonusConfigId = defaultConfig._id;
      }
    }

    // Create new signing bonus with type field
    const newBonus = new this.signingBonusModel({
      employeeId: new Types.ObjectId(dto.employeeId),
      signingBonusId: new Types.ObjectId(signingBonusConfigId),
      givenAmount: dto.givenAmount,
      paymentDate: dto.paymentDate,
      status: 'pending',
      type: dto.type || 'Signing Bonus', // Save the compensation type
    });

    const savedBonus = await newBonus.save();

    return {
      message: 'Compensation created successfully',
      bonus: savedBonus,
    };
  }

  /**
   * Auto-process signing bonuses for a payroll run
   * Fetches all pending bonuses for new hires and marks them for processing
   */
  async autoProcessSigningBonuses(runId: string) {
    const pendingBonuses = await this.signingBonusModel.find({
      status: 'pending',
      payrollRunId: runId,
    });

    if (pendingBonuses.length === 0) {
      return {
        message: 'No pending signing bonuses found for this payroll run',
        count: 0,
      };
    }

    // Mark bonuses as auto-processed
    await this.signingBonusModel.updateMany(
      { status: 'pending', payrollRunId: runId },
      {
        status: 'auto_processed',
        processedAt: new Date(),
      }
    );

    return {
      message: `Successfully auto-processed ${pendingBonuses.length} signing bonuses`,
      count: pendingBonuses.length,
      bonuses: pendingBonuses,
    };
  }

  /**
   * Manual edit of signing bonus
   * Allows payroll specialist to modify bonus details before approval
   */
  async editSigningBonus(dto: EditSigningBonusDto, editorId: string) {
    const bonus = await this.signingBonusModel.findById(dto.bonusId);

    if (!bonus) {
      throw new NotFoundException(`Signing bonus with ID ${dto.bonusId} not found`);
    }

    if (bonus.status === 'approved' || bonus.status === 'rejected') {
      throw new BadRequestException(
        `Cannot edit bonus with status: ${bonus.status}`
      );
    }

    const updateData: any = {
      lastEditedBy: editorId,
      lastEditedAt: new Date(),
    };

    if (dto.adjustedAmount !== undefined) {
      updateData.givenAmount = dto.adjustedAmount;
      updateData.originalAmount = (bonus as any).givenAmount; // Store original
    }

    if (dto.editReason) {
      updateData.editReason = dto.editReason;
    }

    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    if (dto.currency) {
      updateData.currency = dto.currency;
    }

    if (dto.paymentDate) {
      updateData.paymentDate = dto.paymentDate;
    }

    const updatedBonus = await this.signingBonusModel.findByIdAndUpdate(
      dto.bonusId,
      updateData,
      { new: true }
    );

    return {
      message: 'Signing bonus updated successfully',
      bonus: updatedBonus,
    };
  }

  /**
   * Review signing bonus details
   * Retrieves bonus information for review before approval/rejection
   */
  async reviewSigningBonus(bonusId: string, reviewerId: string) {
    const bonus = await this.signingBonusModel
      .findById(bonusId)
      .populate('employeeId', 'firstName lastName email')
      .populate('signingBonusId', 'bonusName amount description');

    if (!bonus) {
      throw new NotFoundException(`Signing bonus with ID ${bonusId} not found`);
    }

    return {
      message: 'Signing bonus retrieved for review',
      bonus,
    };
  }

  /**
   * Approve signing bonus
   * Marks bonus as approved and ready for payroll processing
   */
  async approveSigningBonus(dto: ApproveSigningBonusDto, approverId: string) {
    const bonus = await this.signingBonusModel.findById(dto.bonusId);

    if (!bonus) {
      throw new NotFoundException(`Signing bonus with ID ${dto.bonusId} not found`);
    }

    if (bonus.status === 'approved') {
      throw new BadRequestException('Signing bonus is already approved');
    }

    if (bonus.status === 'rejected') {
      throw new BadRequestException('Cannot approve a rejected bonus');
    }

    const updateData: any = {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      approverComments: dto.approverComments,
    };

    // If approver adjusted the amount during approval
    if (dto.adjustedAmount !== undefined && dto.adjustedAmount !== (bonus as any).givenAmount) {
      updateData.givenAmount = dto.adjustedAmount;
      updateData.originalAmount = (bonus as any).givenAmount;
    }

    const approvedBonus = await this.signingBonusModel.findByIdAndUpdate(
      dto.bonusId,
      updateData,
      { new: true }
    );

    return {
      message: 'Signing bonus approved successfully',
      bonus: approvedBonus,
    };
  }

  /**
   * Reject signing bonus
   * Marks bonus as rejected with reason, excludes from payroll processing
   */
  async rejectSigningBonus(dto: RejectSigningBonusDto, approverId: string) {
    console.log('=== REJECT SIGNING BONUS DEBUG ===');
    console.log('Collection name:', this.signingBonusModel.collection.name);
    console.log('Searching for bonus ID:', dto.bonusId);
    console.log('All documents:', await this.signingBonusModel.find().limit(5).lean());

    const bonus = await this.signingBonusModel.findById(dto.bonusId);
    console.log('Found bonus:', bonus);

    if (!bonus) {
      throw new NotFoundException(`Signing bonus with ID ${dto.bonusId} not found`);
    }

    if (bonus.status === 'approved') {
      throw new BadRequestException('Cannot reject an already approved bonus');
    }

    if (bonus.status === 'rejected') {
      throw new BadRequestException('Signing bonus is already rejected');
    }

    const rejectedBonus = await this.signingBonusModel.findByIdAndUpdate(
      dto.bonusId,
      {
        status: 'rejected',
        rejectedBy: approverId,
        rejectedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
      { new: true }
    );

    return {
      message: 'Signing bonus rejected successfully',
      bonus: rejectedBonus,
    };
  }

  /**
   * Get all signing bonuses for a payroll run
   */
  async getSigningBonusesByRun(runId: string) {
    const bonuses = await this.signingBonusModel
      .find({ payrollRunId: runId })
      .populate('employeeId', 'name email position');

    return {
      count: bonuses.length,
      bonuses,
    };
  }

  /**
   * Get all signing bonuses (including approved/rejected)
   */
  async getPendingSigningBonuses() {
    const allBonuses = await this.signingBonusModel
      .find({}) // Fetch ALL bonuses, not just pending
      .populate('employeeId', 'name email position firstName lastName')
      .sort({ createdAt: -1 });

    return {
      count: allBonuses.length,
      bonuses: allBonuses,
    };
  }
}
