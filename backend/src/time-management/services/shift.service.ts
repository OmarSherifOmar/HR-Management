import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shift, ShiftDocument } from '../models/shift.schema';
import { CreateShiftDto } from '../dtos/shift/create-shift.dto';
import { UpdateShiftDto } from '../dtos/shift/update-shift.dto';

/**
 * Shift Service
 * Implements FR-TM-02: Shift Configuration & Types
 * 
 * Business Rules:
 * - BR-TM-03: Support multiple shift types (Normal, Split, Overnight, Mission, Rotational)
 * - BR-TM-04: Support multiple shift names (Fixed Core Hours, Flex-Time, Rotational, Split, Custom Weekly Patterns, Overtime)
 */
@Injectable()
export class ShiftService {
  constructor(
    @InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>,
  ) {}

  // ==================== CREATE OPERATIONS ====================

  /**
   * FR-TM-02: Create shift configuration
   * Validates shift times and grace periods
   */
  async create(createShiftDto: CreateShiftDto): Promise<ShiftDocument> {
    // Validate shift times
    this.validateShiftTimes(createShiftDto.startTime, createShiftDto.endTime);

    // Validate grace periods
    if (createShiftDto.graceInMinutes && createShiftDto.graceInMinutes < 0) {
      throw new BadRequestException('Grace in minutes cannot be negative');
    }
    if (createShiftDto.graceOutMinutes && createShiftDto.graceOutMinutes < 0) {
      throw new BadRequestException('Grace out minutes cannot be negative');
    }

    const shift = new this.shiftModel({
      ...createShiftDto,
      shiftType: new Types.ObjectId(createShiftDto.shiftType),
    });

    return shift.save();
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Find all shifts with optional filters
   */
  async findAll(filters: any = {}): Promise<ShiftDocument[]> {
    const query = this.shiftModel.find();

    if (filters.active !== undefined) {
      query.where('active').equals(filters.active);
    }

    if (filters.shiftType) {
      query.where('shiftType').equals(new Types.ObjectId(filters.shiftType));
    }

    if (filters.requiresApprovalForOvertime !== undefined) {
      query.where('requiresApprovalForOvertime').equals(filters.requiresApprovalForOvertime);
    }

    return query
      .populate('shiftType', 'name active')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Find shift by ID
   */
  async findById(id: string): Promise<ShiftDocument> {
    const shift = await this.shiftModel
      .findById(id)
      .populate('shiftType', 'name active')
      .exec();

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return shift;
  }

  /**
   * Find active shifts only
   */
  async findActive(): Promise<ShiftDocument[]> {
    return this.shiftModel
      .find({ active: true })
      .populate('shiftType', 'name active')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Find shifts by type
   */
  async findByType(shiftTypeId: string): Promise<ShiftDocument[]> {
    return this.shiftModel
      .find({ shiftType: new Types.ObjectId(shiftTypeId), active: true })
      .populate('shiftType', 'name active')
      .sort({ startTime: 1 })
      .exec();
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * FR-TM-02: Update shift configuration
   */
  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<ShiftDocument> {
    const shift = await this.shiftModel.findById(id);
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    // Validate shift times if being updated
    if (updateShiftDto.startTime || updateShiftDto.endTime) {
      const startTime = updateShiftDto.startTime || shift.startTime;
      const endTime = updateShiftDto.endTime || shift.endTime;
      this.validateShiftTimes(startTime, endTime);
    }

    // Validate grace periods if being updated
    if (updateShiftDto.graceInMinutes !== undefined && updateShiftDto.graceInMinutes < 0) {
      throw new BadRequestException('Grace in minutes cannot be negative');
    }
    if (updateShiftDto.graceOutMinutes !== undefined && updateShiftDto.graceOutMinutes < 0) {
      throw new BadRequestException('Grace out minutes cannot be negative');
    }

    const updateData: any = { ...updateShiftDto };
    if (updateShiftDto.shiftType) {
      updateData.shiftType = new Types.ObjectId(updateShiftDto.shiftType);
    }

    const updated = await this.shiftModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('shiftType', 'name active')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Soft delete (deactivate) shift
   */
  async softDelete(id: string): Promise<ShiftDocument> {
    const shift = await this.shiftModel.findById(id);
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    shift.active = false;
    return shift.save();
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Hard delete shift
   */
  async delete(id: string): Promise<ShiftDocument> {
    const shift = await this.shiftModel.findByIdAndDelete(id);
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Validate shift start and end times
   */
  private validateShiftTimes(startTime: string, endTime: string): void {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    // Allow overnight shifts (end time can be "less" than start time in 24h format)
    // Example: 22:00 to 06:00 is valid for overnight shift
    // We just ensure times are valid HH:MM format (already validated by DTO)
    
    if (startMinutes === endMinutes) {
      throw new BadRequestException('Shift start and end times cannot be the same');
    }
  }

  /**
   * Convert HH:MM time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
