import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, isValidObjectId } from 'mongoose';
import {
  signingBonus,
  signingBonusDocument,
} from '../models/signingBonus.schema';
import { CreateSigningBonusDto } from '../dtos/create-signing-bonus.dto';
import { UpdateSigningBonusDto } from '../dtos/update-signing-bonus.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class SigningBonusesService {
  constructor(
    @InjectModel(signingBonus.name)
    private readonly signingBonusModel: Model<signingBonusDocument>,
  ) {}

  async createSigningBonus(
    createSigningBonusDto: CreateSigningBonusDto,
    // later: createdBy from auth
  ): Promise<signingBonusDocument> {
    const { positionName, amount } = createSigningBonusDto;

    // Enforce unique positionName
    const existing = await this.signingBonusModel
      .findOne({ positionName })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'Signing bonus for this position already exists',
      );
    }

    const doc = new this.signingBonusModel({
      positionName,
      amount,
      status: ConfigStatus.DRAFT,
      // createdBy: userId
    });

    return doc.save();
  }

  async findAllSigningBonuses(): Promise<signingBonusDocument[]> {
    return this.signingBonusModel.find().exec();
  }

  async findOneSigningBonus(id: string): Promise<signingBonusDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid signing bonus id');
    }

    const doc = await this.signingBonusModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Signing bonus not found');
    }

    return doc;
  }

  async updateSigningBonus(
    id: string,
    updateSigningBonusDto: UpdateSigningBonusDto,
  ): Promise<signingBonusDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid signing bonus id');
    }

    const doc = await this.signingBonusModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Signing bonus not found');
    }

    // Phase 1 rule: only edit while status is DRAFT
    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft signing bonuses can be edited',
      );
    }

    if (updateSigningBonusDto.positionName !== undefined) {
      doc.positionName = updateSigningBonusDto.positionName;
    }

    if (updateSigningBonusDto.amount !== undefined) {
      doc.amount = updateSigningBonusDto.amount;
    }

    return doc.save();
  }
   async approve(id: string, approverId: string) {
      const rule = await this.signingBonusModel.findById(id);
      if (!rule) throw new NotFoundException('Signing bonus not found');
      
      if (rule.status === ConfigStatus.APPROVED|| rule.status === ConfigStatus.REJECTED) {
        throw new ForbiddenException('Approved/Rejected signing bonuses cannot be approved');
      }
      rule.status = ConfigStatus.APPROVED;
      rule.approvedBy = new mongoose.Types.ObjectId(approverId);
      rule.approvedAt = new Date();
  
      return rule.save();
    }
  
  async reject(id: string, approverId: string) {
    const rule = await this.signingBonusModel.findById(id);
    if (!rule) throw new NotFoundException('Signing bonus not found');
     if (rule.status === ConfigStatus.APPROVED|| rule.status === ConfigStatus.REJECTED) {
        throw new ForbiddenException('Approved/Rejected signing bonuses cannot be rejected');
      }
  
      rule.status = ConfigStatus.REJECTED;
      rule.approvedBy = new mongoose.Types.ObjectId(approverId);
      rule.approvedAt = new Date();
  
      return rule.save();
    }
  
    async delete(id: string) {
      const rule = await this.signingBonusModel.findById(id);
      if (!rule) throw new NotFoundException('Signing bonus not found');
  
      return this.signingBonusModel.deleteOne({ _id: id }).exec();
    }
}