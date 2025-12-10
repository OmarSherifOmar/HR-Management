import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model, isValidObjectId } from 'mongoose';
  import { payType, payTypeDocument } from '../models/payType.schema';
  import { CreatePayTypeDto } from '../dtos/create-pay-type.dto';
  import { UpdatePayTypeDto } from '../dtos/update-pay-type.dto';
  import { ConfigStatus } from '../enums/payroll-configuration-enums';
  
  @Injectable()
  export class PayTypesService {
    constructor(
      @InjectModel(payType.name)
      private readonly payTypeModel: Model<payTypeDocument>,
    ) {}
  
    async createPayType(
      createPayTypeDto: CreatePayTypeDto,
      createdById: string,
    ): Promise<payTypeDocument> {
      const { type, amount } = createPayTypeDto;
  
      // Ensure unique type
      const existing = await this.payTypeModel.findOne({ type }).exec();
      if (existing) {
        throw new BadRequestException('Pay type with this name already exists');
      }
  
      const doc = new this.payTypeModel({
        type,
        amount,
        status: ConfigStatus.DRAFT,
        createdBy: createdById,
      });
  
      return doc.save();
    }
  
    async findAllPayTypes(): Promise<payTypeDocument[]> {
      return this.payTypeModel.find().exec();
    }
  
    async findOnePayType(id: string): Promise<payTypeDocument> {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid pay type id');
      }
  
      const doc = await this.payTypeModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException('Pay type not found');
      }
  
      return doc;
    }
  
    async updatePayType(
      id: string,
      updatePayTypeDto: UpdatePayTypeDto,
    ): Promise<payTypeDocument> {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid pay type id');
      }
  
      const doc = await this.payTypeModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException('Pay type not found');
      }
  
      // Phase 1 rule: only edit while status is DRAFT
      if (doc.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft pay types can be edited');
      }
  
      if (updatePayTypeDto.type !== undefined) {
        doc.type = updatePayTypeDto.type;
      }
  
      if (updatePayTypeDto.amount !== undefined) {
        doc.amount = updatePayTypeDto.amount;
      }
  
      return doc.save();
    }
  }
