import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { taxRules, taxRulesDocument } from '../models/taxRules.schema';
import { CreateTaxRuleDto } from '../dtos/CreateTaxRuleDto';
import { UpdateTaxRuleDto } from '../dtos/UpdateTaxRuleDto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class TaxRulesService {
  constructor(
    @InjectModel(taxRules.name)
    private taxRulesModel: Model<taxRulesDocument>,
  ) {}

  async create(createDto: CreateTaxRuleDto, createdBy: string) {
    const rule = new this.taxRulesModel({
      ...createDto,
      status: ConfigStatus.DRAFT,
      createdBy,
    });
    return rule.save();
  }

  async findAll() {
    return this.taxRulesModel
      .find()
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .exec();
  }
  async update(id: string, updateDto: UpdateTaxRuleDto) {
    const rule = await this.taxRulesModel.findById(id);
    if (!rule) throw new NotFoundException('Tax rule not found');

    // Only apply provided fields, preserve existing values
    const updateData: Partial<UpdateTaxRuleDto> = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.rate !== undefined) updateData.rate = updateDto.rate;

    Object.assign(rule, updateData);

    // keep it in draft if edited (legal flow logic)
    rule.status = rule.status === ConfigStatus.APPROVED ? ConfigStatus.DRAFT : rule.status;

    return rule.save();
  }

  async findById(id: string) {
    const rule = await this.taxRulesModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .exec();
    if (!rule) throw new NotFoundException('Tax rule not found');
    return rule;
  }

  async approve(id: string, approverId: string) {
    const rule = await this.taxRulesModel.findById(id);
    if (!rule) throw new NotFoundException('Tax rule not found');

    rule.status = ConfigStatus.APPROVED;
    rule.approvedBy = new mongoose.Types.ObjectId(approverId);
    rule.approvedAt = new Date();

    return rule.save();
  }

  async reject(id: string, approverId: string) {
    const rule = await this.taxRulesModel.findById(id);
    if (!rule) throw new NotFoundException('Tax rule not found');

    rule.status = ConfigStatus.REJECTED;
    rule.approvedBy = new mongoose.Types.ObjectId(approverId);
    rule.approvedAt = new Date();

    return rule.save();
  }

  async delete(id: string) {
    const rule = await this.taxRulesModel.findById(id);
    if (!rule) throw new NotFoundException('Tax rule not found');

    return this.taxRulesModel.deleteOne({ _id: id }).exec();
  }

}
