import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Referral, ReferralDocument } from '../models/referral.schema';
import { Model, Types } from 'mongoose';
import { CreateReferralDto } from '../dtos/create-referral.dto';
import { UpdateReferralDto } from '../dtos/update-referral.dto';

@Injectable()
export class ReferralService {
  constructor(
    @InjectModel(Referral.name)
    private referralModel: Model<ReferralDocument>,
  ) {}

  // CREATE
  async create(dto: CreateReferralDto): Promise<Referral> {
    try {
      const data = new this.referralModel({
        ...dto,
        referringEmployeeId: new Types.ObjectId(dto.referringEmployeeId),
        candidateId: new Types.ObjectId(dto.candidateId),
      });

      return await data.save();
    } catch (error) {
      throw new BadRequestException(`Error creating referral: ${error.message}`);
    }
  }

  // GET ALL
  async findAll(): Promise<Referral[]> {
    return this.referralModel
      .find()
      .populate('referringEmployeeId')
      .populate('candidateId')
      .exec();
  }

  // GET BY ID
  async findOne(id: string): Promise<Referral> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const ref = await this.referralModel
      .findById(id)
      .populate('referringEmployeeId')
      .populate('candidateId')
      .exec();

    if (!ref) throw new NotFoundException(`Referral with ID ${id} not found`);

    return ref;
  }

  // UPDATE
  async update(id: string, dto: UpdateReferralDto): Promise<Referral> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const updated = await this.referralModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .populate('referringEmployeeId')
      .populate('candidateId')
      .exec();

    if (!updated) throw new NotFoundException(`Referral with ID ${id} not found`);

    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const deleted = await this.referralModel.findByIdAndDelete(id).exec();

    if (!deleted) throw new NotFoundException(`Referral with ID ${id} not found`);

    return { message: 'Referral deleted successfully' };
  }

  // FIND REFERRALS BY EMPLOYEE
  async findByEmployee(employeeId: string) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    return this.referralModel
      .find({ referringEmployeeId: new Types.ObjectId(employeeId) })
      .populate('candidateId')
      .exec();
  }

  // FIND REFERRALS BY CANDIDATE
  async findByCandidate(candidateId: string) {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID');
    }

    return this.referralModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .populate('referringEmployeeId')
      .exec();
  }
}