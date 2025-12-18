import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, isValidObjectId } from 'mongoose';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsDocument,
} from '../models/terminationAndResignationBenefits';
import { CreateTerminationBenefitsDto } from '../dtos/create-termination-benefits.dto';
import { UpdateTerminationBenefitsDto } from '../dtos/update-termination-benefits.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class TerminationBenefitsService {
  constructor(
    @InjectModel(terminationAndResignationBenefits.name)
    private readonly terminationBenefitsModel: Model<terminationAndResignationBenefitsDocument>,
  ) {}

  async createTerminationBenefit(
    createTerminationBenefitsDto: CreateTerminationBenefitsDto,
    createdById: string,
  ): Promise<terminationAndResignationBenefitsDocument> {
    const { name, amount, terms } = createTerminationBenefitsDto;

    // Ensure unique name
    const existing = await this.terminationBenefitsModel
      .findOne({ name })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'Termination/resignation benefit with this name already exists',
      );
    }

    const doc = new this.terminationBenefitsModel({
      name,
      amount,
      terms,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    });

    return doc.save();
  }

  async findAllTerminationBenefits(): Promise<
    terminationAndResignationBenefitsDocument[]
  > {
    return this.terminationBenefitsModel.find().exec();
  }

  async findOneTerminationBenefit(
    id: string,
  ): Promise<terminationAndResignationBenefitsDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid termination benefit id');
    }

    const doc = await this.terminationBenefitsModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(
        'Termination/resignation benefit not found',
      );
    }

    return doc;
  }

  async updateTerminationBenefit(
    id: string,
    updateTerminationBenefitsDto: UpdateTerminationBenefitsDto,
  ): Promise<terminationAndResignationBenefitsDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid termination benefit id');
    }

    const doc = await this.terminationBenefitsModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(
        'Termination/resignation benefit not found',
      );
    }

    // Phase 1 rule: only edit while status is DRAFT
    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft termination/resignation benefits can be edited',
      );
    }

    if (updateTerminationBenefitsDto.name !== undefined) {
      doc.name = updateTerminationBenefitsDto.name;
    }

    if (updateTerminationBenefitsDto.amount !== undefined) {
      doc.amount = updateTerminationBenefitsDto.amount;
    }

    if (updateTerminationBenefitsDto.terms !== undefined) {
      doc.terms = updateTerminationBenefitsDto.terms;
    }

    return doc.save();
  }

  async approve(id: string, approverId: string) {
    const rule = await this.terminationBenefitsModel.findById(id);
    if (!rule) throw new NotFoundException('Termination benefit not found');
    
    if (rule.status === ConfigStatus.APPROVED || rule.status === ConfigStatus.REJECTED) {
      throw new ForbiddenException('Approved/rejected termination benefits cannot be approved');
    }
    rule.status = ConfigStatus.APPROVED;
    rule.approvedBy = new mongoose.Types.ObjectId(approverId);
    rule.approvedAt = new Date();

    return rule.save();
  }

  async reject(id: string, approverId: string) {
    const rule = await this.terminationBenefitsModel.findById(id);
    if (!rule) throw new NotFoundException('Termination benefit not found');
    if (rule.status === ConfigStatus.APPROVED || rule.status === ConfigStatus.REJECTED) {
      throw new ForbiddenException('Approved/Rejected termination benefits cannot be rejected');
    }

    rule.status = ConfigStatus.REJECTED;
    rule.approvedBy = new mongoose.Types.ObjectId(approverId);
    rule.approvedAt = new Date();

    return rule.save();
  }

  async delete(id: string) {
    const rule = await this.terminationBenefitsModel.findById(id);
    if (!rule) throw new NotFoundException('Termination benefit not found');

    return this.terminationBenefitsModel.deleteOne({ _id: id }).exec();
  }
}