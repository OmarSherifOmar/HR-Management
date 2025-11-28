import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shift, ShiftDocument } from '../models/shift.schema';

@Injectable()
export class ShiftService {
  constructor(@InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>) {}

  async getById(id: string | Types.ObjectId) {
    const _id = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return this.shiftModel.findById(_id);
  }
}
