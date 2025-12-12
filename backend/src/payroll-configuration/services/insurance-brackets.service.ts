import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { insuranceBrackets, insuranceBracketsDocument } from '../models/insuranceBrackets.schema';
import { CreateInsuranceBracketDto } from '../dtos/CreateInsuranceBracketDto';
import { UpdateInsuranceBracketDto } from '../dtos/UpdateInsuranceBracketDto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class InsuranceBracketsService {
  constructor(
    @InjectModel(insuranceBrackets.name)
    private insuranceBracketsModel: Model<insuranceBracketsDocument>,
  ) {}

  async create(createDto: CreateInsuranceBracketDto, createdBy: string) {
    // Check if bracket with same name and salary range already exists
    const existingBracket = await this.insuranceBracketsModel.findOne({
      name: createDto.name,
      minSalary: createDto.minSalary,
      maxSalary: createDto.maxSalary,
    });

    if (existingBracket) {
      throw new Error('Insurance bracket with same name and salary range already exists');
    }

    const bracket = new this.insuranceBracketsModel({
      ...createDto,
      status: ConfigStatus.DRAFT,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    return bracket.save();
  }

  async findAll() {
    return this.insuranceBracketsModel
      .find()
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .sort({ minSalary: 1 })
      .exec();
  }

  async update(
    id: string,
    updateDto: UpdateInsuranceBracketDto,
    updatedBy: string,
  ) {
    const bracket = await this.insuranceBracketsModel.findById(id);
    if (!bracket) throw new NotFoundException('Insurance bracket not found');

    // Check if another bracket with same name and salary range exists (exclude current)
    const existingBracket = await this.insuranceBracketsModel.findOne({
      _id: { $ne: id },
      name: updateDto.name,
      minSalary: updateDto.minSalary,
      maxSalary: updateDto.maxSalary,
    });

    if (existingBracket) {
      throw new Error('Insurance bracket with same name and salary range already exists');
    }

    // Apply update
    Object.assign(bracket, updateDto);

    // Keep it in draft if edited (legal flow logic)
    bracket.status =
      bracket.status === ConfigStatus.APPROVED
        ? ConfigStatus.DRAFT
        : bracket.status;

    bracket.updatedBy = new mongoose.Types.ObjectId(updatedBy);

    return bracket.save();
  }

  async findById(id: string) {
    const bracket = await this.insuranceBracketsModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .exec();

    if (!bracket) throw new NotFoundException('Insurance bracket not found');

    return bracket;
  }

  async approve(id: string, approverId: string) {
    const bracket = await this.insuranceBracketsModel.findById(id);
    if (!bracket) throw new NotFoundException('Insurance bracket not found');

    bracket.status = ConfigStatus.APPROVED;
    bracket.approvedBy = new mongoose.Types.ObjectId(approverId);
    bracket.approvedAt = new Date();

    return bracket.save();
  }

  async reject(id: string, approverId: string) {
    const bracket = await this.insuranceBracketsModel.findById(id);
    if (!bracket) throw new NotFoundException('Insurance bracket not found');

    bracket.status = ConfigStatus.REJECTED;
    bracket.approvedBy = new mongoose.Types.ObjectId(approverId);
    bracket.approvedAt = new Date();

    return bracket.save();
  }

  async delete(id: string) {
    const bracket = await this.insuranceBracketsModel.findById(id);
    if (!bracket) throw new NotFoundException('Insurance bracket not found');

    return this.insuranceBracketsModel.deleteOne({ _id: id }).exec();
  }
}
