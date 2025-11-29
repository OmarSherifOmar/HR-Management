import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveCategory, LeaveCategoryDocument } from '../models/leave-category.schema';

export enum SpecialAbsenceCode {
  BEREAVEMENT = 'BEREAVEMENT',
  JURY_DUTY = 'JURY_DUTY',
  MILITARY = 'MILITARY',
  MISSION = 'MISSION',
  TRAINING = 'TRAINING',
  STUDY = 'STUDY',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export interface SpecialAbsenceRule {
  code: SpecialAbsenceCode | string;
  maxDaysPerYear?: number;
  maxDaysPerOccurrence?: number;
  requiresDocumentation: boolean;
  documentationType?: string;
  isPaid: boolean;
  payPercentage?: number;
  advanceNoticeRequired: boolean;
  advanceNoticeDays?: number;
  autoApprove: boolean;
  approvalLevels?: string[];
  allowExtension: boolean;
  extensionMaxDays?: number;
  notes?: string;
}

@Injectable()
export class SpecialAbsenceService {
  constructor(
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveCategory.name) private leaveCategoryModel: Model<LeaveCategoryDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // CREATE SPECIAL ABSENCE / MISSION TYPE
  // ─────────────────────────────────────────────────────────────

  async createSpecialAbsenceType(data: {
    code: string;
    name: string;
    categoryId: string;
    description?: string;
    rule: SpecialAbsenceRule;
  }): Promise<{ leaveType: LeaveTypeDocument; policy: LeavePolicyDocument }> {
    // Validate category
    const category = await this.leaveCategoryModel.findById(data.categoryId).exec();
    if (!category) throw new NotFoundException(`Category ${data.categoryId} not found`);

    // Create the leave type
    const leaveType = new this.leaveTypeModel({
      code: data.code,
      name: data.name,
      categoryId: data.categoryId,
      description: data.description,
      paid: data.rule.isPaid,
      deductible: false, // Special absences typically don't deduct from regular balance
      requiresAttachment: data.rule.requiresDocumentation,
      attachmentType: data.rule.documentationType,
      maxDurationDays: data.rule.maxDaysPerOccurrence,
    });
    const savedLeaveType = await leaveType.save();

    // Create the associated policy with special rules
    const policy = new this.leavePolicyModel({
      leaveTypeId: savedLeaveType._id,
      accrualMethod: 'NONE', // Special absences don't accrue
      monthlyRate: 0,
      yearlyRate: data.rule.maxDaysPerYear ?? 0,
      carryForwardAllowed: false,
      maxCarryForward: 0,
      minNoticeDays: data.rule.advanceNoticeDays ?? 0,
      maxConsecutiveDays: data.rule.maxDaysPerOccurrence,
      eligibility: {
        specialAbsenceRule: data.rule,
      },
    });
    const savedPolicy = await policy.save();

    return { leaveType: savedLeaveType, policy: savedPolicy };
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE SPECIAL ABSENCE RULE ON POLICY
  // ─────────────────────────────────────────────────────────────

  async updateSpecialAbsenceRule(
    leaveTypeId: string,
    rule: Partial<SpecialAbsenceRule>,
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findOne({ leaveTypeId }).exec();
    if (!policy) throw new NotFoundException(`Policy for leave type ${leaveTypeId} not found`);

    const existingRule = policy.eligibility?.specialAbsenceRule || {};
    policy.eligibility = {
      ...policy.eligibility,
      specialAbsenceRule: { ...existingRule, ...rule },
    };

    // Sync certain fields
    if (rule.maxDaysPerYear !== undefined) {
      policy.yearlyRate = rule.maxDaysPerYear;
    }
    if (rule.maxDaysPerOccurrence !== undefined) {
      policy.maxConsecutiveDays = rule.maxDaysPerOccurrence;
    }
    if (rule.advanceNoticeDays !== undefined) {
      policy.minNoticeDays = rule.advanceNoticeDays;
    }

    return policy.save();
  }

  // ─────────────────────────────────────────────────────────────
  // GET SPECIAL ABSENCE TYPES
  // ─────────────────────────────────────────────────────────────

  async getAllSpecialAbsenceTypes(): Promise<
    { leaveType: LeaveTypeDocument; rule: SpecialAbsenceRule | null }[]
  > {
    // Find leave types that are not deductible (typically special absences)
    const leaveTypes = await this.leaveTypeModel
      .find({ deductible: false })
      .populate('categoryId')
      .exec();

    const results: { leaveType: LeaveTypeDocument; rule: SpecialAbsenceRule | null }[] = [];

    for (const lt of leaveTypes) {
      const policy = await this.leavePolicyModel.findOne({ leaveTypeId: lt._id }).exec();
      results.push({
        leaveType: lt,
        rule: policy?.eligibility?.specialAbsenceRule || null,
      });
    }

    return results;
  }

  async getSpecialAbsenceRuleByLeaveType(leaveTypeId: string): Promise<{
    leaveType: LeaveTypeDocument;
    rule: SpecialAbsenceRule | null;
  }> {
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId).exec();
    if (!leaveType) throw new NotFoundException(`Leave type ${leaveTypeId} not found`);

    const policy = await this.leavePolicyModel.findOne({ leaveTypeId }).exec();

    return {
      leaveType,
      rule: policy?.eligibility?.specialAbsenceRule || null,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PREDEFINED SPECIAL ABSENCE TEMPLATES
  // ─────────────────────────────────────────────────────────────

  getSpecialAbsenceTemplates(): { code: string; name: string; defaultRule: SpecialAbsenceRule }[] {
    return [
      {
        code: SpecialAbsenceCode.BEREAVEMENT,
        name: 'Bereavement Leave',
        defaultRule: {
          code: SpecialAbsenceCode.BEREAVEMENT,
          maxDaysPerYear: 5,
          maxDaysPerOccurrence: 5,
          requiresDocumentation: true,
          documentationType: 'DEATH_CERTIFICATE',
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: false,
          autoApprove: false,
          approvalLevels: ['MANAGER'],
          allowExtension: true,
          extensionMaxDays: 2,
          notes: 'For immediate family members',
        },
      },
      {
        code: SpecialAbsenceCode.JURY_DUTY,
        name: 'Jury Duty',
        defaultRule: {
          code: SpecialAbsenceCode.JURY_DUTY,
          maxDaysPerYear: 30,
          maxDaysPerOccurrence: 30,
          requiresDocumentation: true,
          documentationType: 'COURT_SUMMONS',
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: true,
          advanceNoticeDays: 7,
          autoApprove: true,
          allowExtension: true,
          extensionMaxDays: 30,
          notes: 'Legal obligation',
        },
      },
      {
        code: SpecialAbsenceCode.MILITARY,
        name: 'Military Leave',
        defaultRule: {
          code: SpecialAbsenceCode.MILITARY,
          maxDaysPerYear: 15,
          requiresDocumentation: true,
          documentationType: 'MILITARY_ORDERS',
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: true,
          advanceNoticeDays: 30,
          autoApprove: true,
          allowExtension: true,
          notes: 'Reserve/National Guard duty',
        },
      },
      {
        code: SpecialAbsenceCode.MISSION,
        name: 'Work Mission / Business Travel',
        defaultRule: {
          code: SpecialAbsenceCode.MISSION,
          requiresDocumentation: true,
          documentationType: 'MISSION_ORDER',
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: true,
          advanceNoticeDays: 3,
          autoApprove: false,
          approvalLevels: ['MANAGER', 'HR'],
          allowExtension: true,
          notes: 'Official work mission or travel',
        },
      },
      {
        code: SpecialAbsenceCode.TRAINING,
        name: 'Training Leave',
        defaultRule: {
          code: SpecialAbsenceCode.TRAINING,
          maxDaysPerYear: 10,
          requiresDocumentation: true,
          documentationType: 'TRAINING_REGISTRATION',
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: true,
          advanceNoticeDays: 14,
          autoApprove: false,
          approvalLevels: ['MANAGER', 'HR'],
          allowExtension: false,
          notes: 'Professional development training',
        },
      },
      {
        code: SpecialAbsenceCode.EMERGENCY,
        name: 'Emergency Leave',
        defaultRule: {
          code: SpecialAbsenceCode.EMERGENCY,
          maxDaysPerYear: 3,
          maxDaysPerOccurrence: 1,
          requiresDocumentation: false,
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: false,
          autoApprove: false,
          approvalLevels: ['MANAGER'],
          allowExtension: false,
          notes: 'Unforeseen personal emergency',
        },
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE FROM TEMPLATE
  // ─────────────────────────────────────────────────────────────

  async createFromTemplate(
    templateCode: SpecialAbsenceCode,
    categoryId: string,
    customizations?: Partial<SpecialAbsenceRule>,
  ): Promise<{ leaveType: LeaveTypeDocument; policy: LeavePolicyDocument }> {
    const templates = this.getSpecialAbsenceTemplates();
    const template = templates.find((t) => t.code === templateCode);
    if (!template) throw new BadRequestException(`Template ${templateCode} not found`);

    const rule: SpecialAbsenceRule = { ...template.defaultRule, ...customizations };

    return this.createSpecialAbsenceType({
      code: template.code,
      name: template.name,
      categoryId,
      description: rule.notes,
      rule,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE SPECIAL ABSENCE TYPE
  // ─────────────────────────────────────────────────────────────

  async deleteSpecialAbsenceType(leaveTypeId: string): Promise<{ deleted: boolean }> {
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId).exec();
    if (!leaveType) throw new NotFoundException(`Leave type ${leaveTypeId} not found`);

    await this.leavePolicyModel.deleteMany({ leaveTypeId }).exec();
    await this.leaveTypeModel.findByIdAndDelete(leaveTypeId).exec();

    return { deleted: true };
  }
}
