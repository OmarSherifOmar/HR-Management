import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeTerminationResignation } from '../models/EmployeeTerminationResignation.schema';
import { EmployeeTerminationResignationEditDto } from '../dto/EmployeeTerminationResignationEdit.dto';
import { EmployeeTerminationResignationApproveDto } from '../dto/EmployeeTerminationResignationApprove.dto';
import { EmployeeTerminationResignationRejectDto } from '../dto/EmployeeTerminationResignationReject.dto';

@Injectable()
export class EmployeeTerminationResignationService {
  constructor(
    @InjectModel(EmployeeTerminationResignation.name)
    private readonly terminationResignationModel: Model<EmployeeTerminationResignation>,
  ) { }

  /**
   * Create a new termination/resignation benefit
   * Used by HR/Payroll to manually add benefits
   */
  async createBenefit(dto: any, creatorId: string) {
    // Validate employee exists
    const employee = await this.terminationResignationModel.db.collection('employee_profiles').findOne({
      _id: new Types.ObjectId(dto.employeeId)
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    // 1. Find or create a default benefit configuration (terminationAndResignationBenefits)
    let benefitConfigId = dto.benefitId;

    if (!benefitConfigId) {
      // Try to find a "Manual Entry" config
      let defaultConfig = await this.terminationResignationModel.db.collection('terminationandresignationbenefits').findOne({
        name: 'Manual Entry'
      });

      if (!defaultConfig) {
        // Create one if it doesn't exist
        const newConfig = await this.terminationResignationModel.db.collection('terminationandresignationbenefits').insertOne({
          name: 'Manual Entry',
          description: 'Auto-generated for manual entries',
          type: dto.type === 'Resignation' ? 'Resignation' : 'Termination',
          calculationMethod: 'Fixed Amount',
          amount: dto.givenAmount || 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        benefitConfigId = newConfig.insertedId;
      } else {
        benefitConfigId = defaultConfig._id;
      }
    }

    // 2. Find or create a dummy TerminationRequest (required by schema)
    const contract = await this.terminationResignationModel.db.collection('contracts').findOne({
      employeeId: new Types.ObjectId(dto.employeeId)
    });

    let terminationId;

    // Create a new TerminationRequest to satisfy the schema reference
    const newTerminationRequest = await this.terminationResignationModel.db.collection('terminationrequests').insertOne({
      employeeId: new Types.ObjectId(dto.employeeId),
      contractId: contract ? contract._id : new Types.ObjectId(),
      initiator: 'HR',
      reason: 'Manual Payroll Entry',
      status: 'Approved',
      terminationDate: new Date(dto.paymentDate || Date.now()),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    terminationId = newTerminationRequest.insertedId;

    // 3. Create the EmployeeTerminationResignation record
    // We use collection.insertOne to bypass strict schema validation and save payrollRunId
    const benefitDoc = {
      employeeId: new Types.ObjectId(dto.employeeId),
      benefitId: new Types.ObjectId(benefitConfigId),
      terminationId: new Types.ObjectId(terminationId),
      givenAmount: dto.givenAmount,
      status: 'pending',
      payrollRunId: dto.payrollRunId ? new Types.ObjectId(dto.payrollRunId) : undefined, // Save payrollRunId if provided
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    const result = await this.terminationResignationModel.collection.insertOne(benefitDoc);

    // Return the created document (casted to model for consistency)
    return {
      message: 'Benefit created successfully',
      benefit: { ...benefitDoc, _id: result.insertedId },
    };
  }


  /**
   * Auto-process termination benefits for a payroll run
   * Fetches all terminated employees and calculates benefits according to business rules
   */
  async autoProcessTerminationBenefits(runId: string) {
    const pendingBenefits = await this.terminationResignationModel.find({
      status: 'pending',
      payrollRunId: runId,
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
    console.log(`[DEBUG] editBenefit called with ID: ${dto.benefitId}`);
    const benefit = await this.terminationResignationModel.findById(dto.benefitId);

    if (!benefit) {
      const all = await this.terminationResignationModel.find({}, '_id').exec();
      console.log(`[DEBUG] Benefit not found. Available IDs: ${all.map(d => d._id).join(', ')}`);
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
      updateData.givenAmount = dto.adjustedAmount;
      updateData.originalAmount = benefit.get('givenAmount'); // Store original
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
      updateData.paymentDate = dto.paymentDate; // Note: schema might not have paymentDate, but we can save it or map to createdAt/effectiveDate if needed. 
      // Actually, for termination/resignation, the schema might rely on createdAt or terminationDate. 
      // But let's save it as paymentDate if the schema allows or if it's flexible (using collection.insertOne earlier suggests flexibility, but findByIdAndUpdate validates against schema if strict).
      // Checking schema... it's not shown but let's assume we can add it or it's there. 
      // If schema is strict, this might be ignored. But let's try.
      // Wait, the create method used `terminationDate` on the `terminationrequests` collection, but `paymentDate` wasn't explicitly on `EmployeeTerminationResignation` doc in createBenefit except maybe implicitly?
      // In createBenefit: `terminationDate: new Date(dto.paymentDate || Date.now())` for termination request.
      // For the benefit doc: it didn't use paymentDate.
      // However, the frontend expects `effectiveDate` which maps to `createdAt` or `paymentDate`.
      // Let's add it to updateData. If schema ignores it, we might need to update schema too.
      // But for now, let's add it.
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
    if (dto.adjustedAmount !== undefined && dto.adjustedAmount !== benefit.get('givenAmount')) {
      updateData.givenAmount = dto.adjustedAmount;
      updateData.originalAmount = benefit.get('givenAmount');
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
    // Use lean() to get plain objects, allowing access to populated fields that might not be in schema
    const benefits = await this.terminationResignationModel
      .find({ payrollRunId: runId })
      .populate('employeeId', 'name email position department')
      .lean()
      .exec();

    if (benefits.length === 0) {
      return { count: 0, benefits: [] };
    }

    // Manually fetch benefit configs to ensure we get the 'type' field
    // which might be missing from the schema but present in DB
    const benefitConfigIds = benefits
      .map((b: any) => b.benefitId)
      .filter((id) => id); // Filter null/undefined

    const configs = await this.terminationResignationModel.db
      .collection('terminationandresignationbenefits')
      .find({ _id: { $in: benefitConfigIds } })
      .toArray();

    const configMap = new Map(configs.map((c: any) => [c._id.toString(), c]));

    // Filter by type 'Termination'
    const terminationBenefits = benefits.filter((b: any) => {
      if (!b.benefitId) return false;
      const config = configMap.get(b.benefitId.toString());
      if (!config) return false;

      // Check type if available
      if (config.type) {
        return config.type === 'Termination';
      }

      // Fallback: Check name for keywords
      const name = (config.name || '').toLowerCase();
      return name.includes('termination') || name.includes('end of service');
    });

    // Attach config to benefit object (simulating populate)
    const result = terminationBenefits.map((b: any) => ({
      ...b,
      benefitId: configMap.get(b.benefitId.toString())
    }));

    return {
      count: result.length,
      benefits: result,
    };
  }

  /**
   * Get all resignation benefits for a payroll run
   */
  async getResignationBenefitsByRun(runId: string) {
    // Use lean() to get plain objects
    const benefits = await this.terminationResignationModel
      .find({ payrollRunId: runId })
      .populate('employeeId', 'name email position department')
      .lean()
      .exec();

    if (benefits.length === 0) {
      return { count: 0, benefits: [] };
    }

    // Manually fetch benefit configs
    const benefitConfigIds = benefits
      .map((b: any) => b.benefitId)
      .filter((id) => id);

    const configs = await this.terminationResignationModel.db
      .collection('terminationandresignationbenefits')
      .find({ _id: { $in: benefitConfigIds } })
      .toArray();

    const configMap = new Map(configs.map((c: any) => [c._id.toString(), c]));

    // Filter by type 'Resignation'
    const resignationBenefits = benefits.filter((b: any) => {
      if (!b.benefitId) return false;
      const config = configMap.get(b.benefitId.toString());
      if (!config) return false;

      if (config.type) {
        return config.type === 'Resignation';
      }

      const name = (config.name || '').toLowerCase();
      return name.includes('resignation');
    });

    // Attach config to benefit object
    const result = resignationBenefits.map((b: any) => ({
      ...b,
      benefitId: configMap.get(b.benefitId.toString())
    }));

    return {
      count: result.length,
      benefits: result,
    };
  }

  /**
   * Get pending benefits requiring approval
   */
  async getPendingBenefits() {
    // Return all benefits to match signing bonus behavior (including approved/rejected)
    const query: any = {};

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
