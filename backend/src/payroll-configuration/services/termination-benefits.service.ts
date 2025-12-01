import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
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
    // later: createdBy from auth
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
      // createdBy: userId
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
}