import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, isValidObjectId } from 'mongoose';
import {
  payrollPolicies,
  payrollPoliciesDocument,
} from '../models/payrollPolicies.schema';
import { CreatePayrollPolicyDto } from '../dtos/create-payroll-policy.dto';
import { UpdatePayrollPolicyDto } from '../dtos/update-payroll-policy.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class PayrollPoliciesService {
  constructor(
    @InjectModel(payrollPolicies.name)
    private readonly payrollPoliciesModel: Model<payrollPoliciesDocument>,
  ) {}

  async createPayrollPolicy(
    createPayrollPolicyDto: CreatePayrollPolicyDto,
    createdById: string,
  ): Promise<payrollPoliciesDocument> {
    const {
      policyName,
      policyType,
      description,
      effectiveDate,
      ruleDefinition,
      applicability,
    } = createPayrollPolicyDto;

    // Enforce unique policy name (you can later refine uniqueness rules if needed)
    const existing = await this.payrollPoliciesModel
      .findOne({ policyName })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'A payroll policy with this name already exists',
      );
    }

    const effectiveDateObj = new Date(effectiveDate);
    if (isNaN(effectiveDateObj.getTime())) {
      throw new BadRequestException('Invalid effectiveDate format');
    }

    const doc = new this.payrollPoliciesModel({
      policyName,
      policyType,
      description,
      effectiveDate: effectiveDateObj,
      ruleDefinition: {
        percentage: ruleDefinition.percentage,
        fixedAmount: ruleDefinition.fixedAmount,
        thresholdAmount: ruleDefinition.thresholdAmount,
      },
      applicability,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    });

    return doc.save();
  }

  async findAllPayrollPolicies(): Promise<payrollPoliciesDocument[]> {
    return this.payrollPoliciesModel.find().exec();
  }

  async findOnePayrollPolicy(id: string): Promise<payrollPoliciesDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid payroll policy id');
    }

    const doc = await this.payrollPoliciesModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Payroll policy not found');
    }

    return doc;
  }

  async updatePayrollPolicy(
    id: string,
    updatePayrollPolicyDto: UpdatePayrollPolicyDto,
  ): Promise<payrollPoliciesDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid payroll policy id');
    }

    const doc = await this.payrollPoliciesModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Payroll policy not found');
    }

    // Phase 1 rule: only edit while status is DRAFT
    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft payroll policies can be edited',
      );
    }

    const {
      policyName,
      policyType,
      description,
      effectiveDate,
      ruleDefinition,
      applicability,
    } = updatePayrollPolicyDto;

    if (policyName !== undefined) {
      doc.policyName = policyName;
    }

    if (policyType !== undefined) {
      doc.policyType = policyType;
    }

    if (description !== undefined) {
      doc.description = description;
    }

    if (effectiveDate !== undefined) {
      const effectiveDateObj = new Date(effectiveDate);
      if (isNaN(effectiveDateObj.getTime())) {
        throw new BadRequestException('Invalid effectiveDate format');
      }
      doc.effectiveDate = effectiveDateObj;
    }

    if (ruleDefinition !== undefined) {
      if (!doc.ruleDefinition) {
        // safety: initialize if missing for some reason
        (doc as any).ruleDefinition = {};
      }

      if (ruleDefinition.percentage !== undefined) {
        doc.ruleDefinition.percentage = ruleDefinition.percentage;
      }

      if (ruleDefinition.fixedAmount !== undefined) {
        doc.ruleDefinition.fixedAmount = ruleDefinition.fixedAmount;
      }

      if (ruleDefinition.thresholdAmount !== undefined) {
        doc.ruleDefinition.thresholdAmount = ruleDefinition.thresholdAmount;
      }
    }

    if (applicability !== undefined) {
      doc.applicability = applicability;
    }

    return doc.save();
  }

  async approve(id: string, approverId: string) {
    const rule = await this.payrollPoliciesModel.findById(id);
    if (!rule) throw new NotFoundException('Payroll policy not found');
    
    if (rule.status === ConfigStatus.APPROVED || rule.status === ConfigStatus.REJECTED) {
      throw new ForbiddenException('Approved/rejected payroll policies cannot be approved');
    }
    rule.status = ConfigStatus.APPROVED;
    rule.approvedBy = new mongoose.Types.ObjectId(approverId);
    rule.approvedAt = new Date();

    return rule.save();
  }

  async reject(id: string, approverId: string) {
    const rule = await this.payrollPoliciesModel.findById(id);
    if (!rule) throw new NotFoundException('Payroll policy not found');
    if (rule.status === ConfigStatus.APPROVED || rule.status === ConfigStatus.REJECTED) {
      throw new ForbiddenException('Approved/Rejected payroll policies cannot be rejected');
    }

    rule.status = ConfigStatus.REJECTED;
    rule.approvedBy = new mongoose.Types.ObjectId(approverId);
    rule.approvedAt = new Date();

    return rule.save();
  }

  async delete(id: string) {
    const rule = await this.payrollPoliciesModel.findById(id);
    if (!rule) throw new NotFoundException('Payroll policy not found');

    return this.payrollPoliciesModel.deleteOne({ _id: id }).exec();
  }
}
