import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { allowance, allowanceDocument } from '../models/allowance.schema';
import { CreateAllowanceDto } from '../dtos/create-allowance.dto';
import { UpdateAllowanceDto } from '../dtos/update-allowance.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class AllowancesService {
  constructor(
    @InjectModel(allowance.name)
    private readonly allowanceModel: Model<allowanceDocument>,
  ) {}

  async createAllowance(
    createAllowanceDto: CreateAllowanceDto,
    createdById: string,
  ): Promise<allowanceDocument> {
    const { name, amount } = createAllowanceDto;

    // Ensure unique name (optional but nice to enforce at service level too)
    const existing = await this.allowanceModel.findOne({ name }).exec();
    if (existing) {
      throw new BadRequestException('Allowance with this name already exists');
    }

    const doc = new this.allowanceModel({
      name,
      amount,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    });

    return doc.save();
  }

  async findAllAllowances(): Promise<allowanceDocument[]> {
    return this.allowanceModel.find().exec();
  }

  async findOneAllowance(id: string): Promise<allowanceDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid allowance id');
    }

    const doc = await this.allowanceModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Allowance not found');
    }

    return doc;
  }

  async updateAllowance(
    id: string,
    updateAllowanceDto: UpdateAllowanceDto,
  ): Promise<allowanceDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid allowance id');
    }

    const doc = await this.allowanceModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Allowance not found');
    }

    // Phase 1 rule: only edit while status is DRAFT
    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft allowances can be edited',
      );
    }

    if (updateAllowanceDto.name !== undefined) {
      doc.name = updateAllowanceDto.name;
    }

    if (updateAllowanceDto.amount !== undefined) {
      doc.amount = updateAllowanceDto.amount;
    }

    return doc.save();
  }
}
