import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class ConfigurationApprovalService {
  // allowed resource types for approval flows (exclude insuranceBrackets and CompanyWideSettings)
  private allowedTypes = [
    'allowance',
    'taxRules',
    'payrollPolicies',
    'payType',
    'signingBonus',
    'terminationAndResignationBenefits',
    'payGrade',
    'insuranceBrackets',
  ];

  constructor(@InjectConnection() private readonly connection: Connection) {}

  private validateType(type: string) {
    if (!this.allowedTypes.includes(type)) {
      throw new BadRequestException(`Type '${type}' is not supported for approval operations.`);
    }
  }

  private getModel(type: string) {
    this.validateType(type);
    // Model registered in module under the class name string (e.g. 'allowance')
    try {
      // connection.model may throw if model not registered
      return this.connection.model(type);
    } catch (err) {
      throw new BadRequestException(`Model for type '${type}' not registered`);
    }
  }

  async findAll(type: string) {
    const Model: any = this.getModel(type);
    return Model.find().populate('createdBy', 'fullName email').populate('approvedBy', 'fullName email').exec();
  }

  async findOne(type: string, id: string) {
    const Model: any = this.getModel(type);
    const doc = await Model.findById(id).populate('createdBy', 'fullName email').populate('approvedBy', 'fullName email').exec();
    if (!doc) throw new NotFoundException(`${type} with id ${id} not found`);
    return doc;
  }

  async update(type: string, id: string, payload: any, updatedBy?: string) {
    const Model: any = this.getModel(type);
    const doc = await Model.findById(id);
    if (!doc) throw new NotFoundException(`${type} with id ${id} not found`);

    // apply payload (partial update)
    Object.assign(doc, payload);

    // If previously approved, revert to draft so payroll manager re-approves
    if (doc.status === ConfigStatus.APPROVED) {
      doc.status = ConfigStatus.DRAFT;
    }

    if (updatedBy) doc.updatedBy = new Types.ObjectId(updatedBy);

    return doc.save();
  }

  async approve(type: string, id: string, approverId: string) {
    const Model: any = this.getModel(type);
    const doc = await Model.findById(id);
    if (!doc) throw new NotFoundException(`${type} with id ${id} not found`);

    doc.status = ConfigStatus.APPROVED;
    doc.approvedBy = new Types.ObjectId(approverId);
    doc.approvedAt = new Date();

    return doc.save();
  }

  async reject(type: string, id: string, approverId: string) {
    const Model: any = this.getModel(type);
    const doc = await Model.findById(id);
    if (!doc) throw new NotFoundException(`${type} with id ${id} not found`);

    doc.status = ConfigStatus.REJECTED;
    doc.approvedBy = new Types.ObjectId(approverId);
    doc.approvedAt = new Date();

    return doc.save();
  }

  async remove(type: string, id: string) {
    // Prevent deletion of insurance or company settings at a higher level by validation
    const Model: any = this.getModel(type);
    const doc = await Model.findById(id);
    if (!doc) throw new NotFoundException(`${type} with id ${id} not found`);

    return Model.deleteOne({ _id: id }).exec();
  }
}
