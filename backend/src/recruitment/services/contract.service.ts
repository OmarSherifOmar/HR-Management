import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument } from '../models/contract.schema';
import { CreateContractDto } from '../dtos/create-contract.dto';
import { UpdateContractDto } from '../dtos/update-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectModel(Contract.name)
    private contractModel: Model<ContractDocument>,
  ) {}

  // CREATE
  async create(dto: CreateContractDto): Promise<Contract> {
    try {
      const created = new this.contractModel({
        ...dto,
        offerId: new Types.ObjectId(dto.offerId),
        documentId: dto.documentId ? new Types.ObjectId(dto.documentId) : undefined,
      });

      return await created.save();
    } catch (error) {
      throw new BadRequestException(`Error creating contract: ${error.message}`);
    }
  }

  // GET ALL
  async findAll(): Promise<Contract[]> {
    return this.contractModel
      .find()
      .populate('offerId')
      .populate('documentId')
      .exec();
  }

  // GET ONE
  async findOne(id: string): Promise<Contract> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid contract ID');
    }

    const contract = await this.contractModel
      .findById(id)
      .populate('offerId')
      .populate('documentId')
      .exec();

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  // UPDATE
  async update(id: string, dto: UpdateContractDto): Promise<Contract> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid contract ID');
    }

    const updated = await this.contractModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('offerId')
      .populate('documentId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid contract ID');
    }

    const deleted = await this.contractModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return { message: 'Contract deleted successfully' };
  }

  // GET CONTRACT BY OFFER ID
  async findByOffer(offerId: string): Promise<Contract[]> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID');
    }

    return await this.contractModel
      .find({ offerId: new Types.ObjectId(offerId) })
      .populate('offerId')
      .populate('documentId')
      .exec();
  }
}