import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shift, ShiftDocument } from '../models/shift.schema';
import { ShiftType } from '../models/shift-type.schema';

@Injectable()
export class ShiftService {
  constructor(
    @InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>,
    @InjectModel(ShiftType.name) private shiftTypeModel: Model<ShiftType>,
) {}

  async getById(id: string | Types.ObjectId) {
    const _id = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return this.shiftModel.findById(_id);
  }

  async getRestDaysForShift(id: string | Types.ObjectId) {
    const shift = await this.getById(id);
    if(!shift) {
      throw new NotFoundException('Shift not found');
    }
    const shiftTypeId = shift.shiftType;
    const shiftType = await this.shiftTypeModel.findById(shiftTypeId);
    if(!shiftType) {
      throw new NotFoundException('Shift type not found for the given shift');
    }
    const restDays = (shiftType as any).restDays as number[] || [];
    return restDays;
  }
}
