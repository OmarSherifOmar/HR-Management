import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShiftAssignment, ShiftAssignmentDocument } from '../models/shift-assignment.schema';

@Injectable()
export class ShiftAssignmentService {
 
  constructor(
    @InjectModel(ShiftAssignment.name) private assignmentModel: Model<ShiftAssignmentDocument>,
  ) {}

  // Get active shift assignment for employee at given date 
  async getEmployeeActiveShift(employeeId: string | Types.ObjectId, date: Date = new Date()) {
    const emp = typeof employeeId === 'string' ? new Types.ObjectId(employeeId) : employeeId;
    const today = date;
    return this.assignmentModel.findOne({
      employeeId: emp,
      startDate: { $lte: today },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: today } }],
      status: { $in: ['APPROVED', 'PENDING'] },
    });
  }

  // TODO: the other methods
}
