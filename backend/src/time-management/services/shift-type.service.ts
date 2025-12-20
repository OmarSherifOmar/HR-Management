import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShiftType, ShiftTypeDocument } from '../models/shift-type.schema';
import { CreateShiftTypeDto } from '../dtos/shift-type/create-shift-type.dto';
import { UpdateShiftTypeDto } from '../dtos/shift-type/update-shift-type.dto';

@Injectable()
export class ShiftTypeService {
  constructor(
    @InjectModel(ShiftType.name) private shiftTypeModel: Model<ShiftTypeDocument>,
  ) {}

  async create(createShiftTypeDto: CreateShiftTypeDto): Promise<ShiftTypeDocument> {
    const createdShiftType = new this.shiftTypeModel(createShiftTypeDto);
    return createdShiftType.save();
  }

  async findAll(): Promise<ShiftTypeDocument[]> {
    return this.shiftTypeModel.find().exec();
  }

  async findOne(id: string): Promise<ShiftTypeDocument | null> {
    return this.shiftTypeModel.findById(id).exec();
  }

  async update(id: string, updateShiftTypeDto: UpdateShiftTypeDto): Promise<ShiftTypeDocument | null> {
    return this.shiftTypeModel
      .findByIdAndUpdate(id, updateShiftTypeDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<ShiftTypeDocument | null> {
    return this.shiftTypeModel.findByIdAndDelete(id).exec();
  }
}