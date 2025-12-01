// backend/src/payroll-tracking/payroll-tracking.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { claims, claimsDocument } from './models/claims.schema';
import { disputes, disputesDocument } from './models/disputes.schema';
import { refunds, refundsDocument } from './models/refunds.schema';

import { paySlip, PayslipDocument } from '../payroll-execution/models/payslip.schema';

import { PayrollReportQueryDto } from './dto/payroll-report-query.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';

import {
  ClaimStatus,
  DisputeStatus,
  RefundStatus,
} from './enums/payroll-tracking-enum';

// Helper: pick a single role (if array)
function pickRole(roleOrRoles: any): string | undefined {
  if (!roleOrRoles) return undefined;
  if (Array.isArray(roleOrRoles)) return roleOrRoles[0];
  return roleOrRoles;
}

// Helper: safe enum validation + casting
function castEnumValue<T>(enumObj: any, value: string): T {
  if (!Object.values(enumObj).includes(value)) {
    throw new BadRequestException(`Invalid enum value: ${value}`);
  }
  return value as unknown as T;
}

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(claims.name)
    private claimModel: Model<claimsDocument>,

    @InjectModel(disputes.name)
    private disputeModel: Model<disputesDocument>,

    @InjectModel(refunds.name)
    private refundModel: Model<refundsDocument>,

    @InjectModel(paySlip.name)
    private payslipModel: Model<PayslipDocument>,
  ) {}

  // ============================================================
  // EMPLOYEE — CLAIMS
  // ============================================================
  async getClaimsForEmployee(employeeId: string) {
    if (!Types.ObjectId.isValid(employeeId))
      throw new BadRequestException('Invalid employee id');
    return this.claimModel.find({ employeeId }).sort({ createdAt: -1 }).lean();
  }

  async getClaimByIdForEmployee(employeeId: string, claimId: string) {
    if (!Types.ObjectId.isValid(claimId))
      throw new BadRequestException('Invalid claim id');

    // NOTE: do NOT call .lean() here because tests may stub findById()
    const claim: any = await this.claimModel.findById(claimId);
    if (!claim) throw new NotFoundException('Claim not found');

    const claimEmployeeId = claim.employeeId
      ? String(claim.employeeId._id ?? claim.employeeId)
      : undefined;
    if (String(claimEmployeeId) !== String(employeeId))
      throw new ForbiddenException('Access denied');

    if (typeof claim.toObject === 'function') return claim.toObject();
    return claim;
  }

  // ============================================================
  // EMPLOYEE — TAX DOCUMENTS (payslips)
  // ============================================================
  async listTaxDocumentsForEmployee(employeeId: string) {
    if (!Types.ObjectId.isValid(employeeId))
      throw new BadRequestException('Invalid employee id');

    const docs = await this.payslipModel
      .find(
        { employeeId },
        {
          payrollRunId: 1,
          totalGrossSalary: 1,
          netPay: 1,
          createdAt: 1,
        },
      )
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((p: any) => ({
      payrollRunId: p.payrollRunId,
      gross: p.totalGrossSalary,
      net: p.netPay,
      createdAt: p.createdAt,
    }));
  }

  // ============================================================
  // PAYROLL SPECIALIST — PAYROLL REPORT
  // ============================================================
  async generatePayrollReport(query: PayrollReportQueryDto) {
    const match: any = {};

    if (query.month) {
      if (Types.ObjectId.isValid(query.month))
        match.payrollRunId = new Types.ObjectId(query.month);
      else match.payrollRunId = query.month;
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: '$payrollRunId',
          totalGross: { $sum: { $ifNull: ['$totalGrossSalary', 0] } },
          totalNet: { $sum: { $ifNull: ['$netPay', 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalGross: -1 } },
    ];

    return this.payslipModel.aggregate(pipeline);
  }

  // ============================================================
  // SPECIALIST/MANAGER — DISPUTES
  // ============================================================
  async listDisputes(filter?: { status?: string }) {
    const query: any = {};

    if (filter?.status) {
      if (
        !Object.values(DisputeStatus).includes(filter.status as DisputeStatus)
      )
        throw new BadRequestException(
          `Invalid dispute status: ${filter.status}`,
        );

      query.status = filter.status;
    }

    return this.disputeModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateDispute(
    disputeId: string,
    updater: { userId: string; role: string },
    dto: UpdateDisputeDto,
  ) {
    if (!Types.ObjectId.isValid(disputeId))
      throw new BadRequestException('Invalid dispute id');

    const dispute: any = await this.disputeModel.findById(disputeId);
    if (!dispute) throw new NotFoundException('Dispute not found');

    // Status update (enum-safe)
    if (dto.status) {
      dispute.status = castEnumValue<DisputeStatus>(DisputeStatus, dto.status);
    }

    // Resolution note
    if (dto.note) {
      const entry = {
        by: updater.userId,
        role: pickRole(updater.role),
        note: dto.note,
        date: new Date(),
      };

      if (Array.isArray(dispute.resolutionNotes))
        dispute.resolutionNotes.push(entry);
      else dispute.resolutionNotes = [entry];
    }

    await dispute.save();

    if (typeof dispute.toObject === 'function') return dispute.toObject();
    return dispute;
  }

  async managerApproveDispute(disputeId: string, managerId: string) {
    if (!Types.ObjectId.isValid(disputeId))
      throw new BadRequestException('Invalid dispute id');

    const dispute: any = await this.disputeModel.findById(disputeId);
    if (!dispute) throw new NotFoundException('Dispute not found');

    dispute.status = DisputeStatus.APPROVED;

    const entry = {
      by: managerId,
      role: 'Payroll Manager',
      note: 'Manager approval',
      date: new Date(),
    };

    if (Array.isArray(dispute.resolutionNotes))
      dispute.resolutionNotes.push(entry);
    else dispute.resolutionNotes = [entry];

    await dispute.save();

    if (typeof dispute.toObject === 'function') return dispute.toObject();
    return dispute;
  }

  // ============================================================
  // SPECIALIST/MANAGER — CLAIMS
  // ============================================================
  async listClaims(filter?: { status?: string }) {
    const query: any = {};

    if (filter?.status) {
      if (!Object.values(ClaimStatus).includes(filter.status as ClaimStatus))
        throw new BadRequestException(`Invalid claim status: ${filter.status}`);

      query.status = filter.status;
    }

    return this.claimModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateClaim(
    claimId: string,
    updater: { userId: string; role: string },
    dto: UpdateClaimDto,
  ) {
    if (!Types.ObjectId.isValid(claimId))
      throw new BadRequestException('Invalid claim id');

    const claim: any = await this.claimModel.findById(claimId);
    if (!claim) throw new NotFoundException('Claim not found');

    // Status update (enum-safe)
    if (dto.status) {
      claim.status = castEnumValue<ClaimStatus>(ClaimStatus, dto.status);
    }

    // Add note
    if (dto.note) {
      const entry = {
        by: updater.userId,
        role: pickRole(updater.role),
        note: dto.note,
        date: new Date(),
      };

      if (claim.notes && Array.isArray(claim.notes)) claim.notes.push(entry);
      else claim.notes = [entry];
    }

    await claim.save();

    if (typeof claim.toObject === 'function') return claim.toObject();
    return claim;
  }

  // ============================================================
  // TRANSPARENCY SUMMARY
  // ============================================================
  async transparencySummary() {
    const totalPayslips = await this.payslipModel.countDocuments();
    const totalDisputes = await this.disputeModel.countDocuments();
    const totalClaims = await this.claimModel.countDocuments();

    const pendingDisputes = await this.disputeModel.countDocuments({
      status: DisputeStatus.UNDER_REVIEW,
    });

    const pendingClaims = await this.claimModel.countDocuments({
      status: ClaimStatus.UNDER_REVIEW,
    });

    const refundsProcessed = await this.refundModel.countDocuments({
      status: RefundStatus.PAID,
    });

    return {
      totalPayslips,
      totalDisputes,
      totalClaims,
      pendingDisputes,
      pendingClaims,
      refundsProcessed,
    };
  }

  // ============================================================
  // FINANCE — PROCESS REFUND
  // ============================================================
  async processRefund(
    actor: { userId: string; role: string },
    dto: ProcessRefundDto,
  ) {
    if (!Types.ObjectId.isValid(dto.linkedId))
      throw new BadRequestException('Invalid linked ID');

    const linkedIdObj = new Types.ObjectId(dto.linkedId);

    const dispute: any = await this.disputeModel.findById(linkedIdObj);
    const claim: any = dispute
      ? null
      : await this.claimModel.findById(linkedIdObj);

    if (!dispute && !claim)
      throw new NotFoundException('No linked dispute/claim found');

    // Create refundDetails (matches your schema)
    const details = {
      description: dto.reason || 'Refund processed',
      amount: dto.amount,
    };

    const refund: any = await this.refundModel.create({
      claimId: claim ? claim._id : undefined,
      disputeId: dispute ? dispute._id : undefined,
      refundDetails: details,
      employeeId: dispute
        ? dispute.employeeId
        : claim
          ? claim.employeeId
          : undefined,
      financeStaffId: actor.userId
        ? new Types.ObjectId(actor.userId)
        : undefined,
      status: RefundStatus.PAID,
    });

    // Update dispute → set status to APPROVED because refund resolves it
    if (dispute) {
      dispute.status = DisputeStatus.APPROVED;

      const note = {
        by: actor.userId,
        role: pickRole(actor.role),
        note: `Refund of ${dto.amount} processed`,
        date: new Date(),
      };

      if (dispute.resolutionNotes) dispute.resolutionNotes.push(note);
      else dispute.resolutionNotes = [note];

      await dispute.save();
    }

    // Update claim → set status to APPROVED
    if (claim) {
      claim.status = ClaimStatus.APPROVED;

      const note = {
        by: actor.userId,
        role: pickRole(actor.role),
        note: `Refund of ${dto.amount} processed`,
        date: new Date(),
      };

      if (claim.notes) claim.notes.push(note);
      else claim.notes = [note];

      await claim.save();
    }

    if (typeof refund.toObject === 'function') return refund.toObject();
    return refund;
  }
}