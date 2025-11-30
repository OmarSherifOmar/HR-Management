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
  async update(id: string, updateDto: UpdateTaxRuleDto, updatedBy: string) {
    const rule = await this.taxRulesModel.findById(id);
    if (!rule) throw new NotFoundException('Tax rule not found');

    // apply update
    Object.assign(rule, updateDto);

    // keep it in draft if edited (legal flow logic)
    rule.status = rule.status === ConfigStatus.APPROVED ? ConfigStatus.DRAFT : rule.status;
    rule.updatedBy = new mongoose.Types.ObjectId(updatedBy);

    return rule.save();
  }

}
