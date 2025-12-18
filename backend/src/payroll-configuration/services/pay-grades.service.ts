import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, isValidObjectId } from 'mongoose';
import { payGrade, payGradeDocument } from '../models/payGrades.schema';
import { CreatePayGradeDto } from '../dtos/create-pay-grade.dto';
import { UpdatePayGradeDto } from '../dtos/update-pay-grade.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
import { AllowancesService } from './allowances.service';

@Injectable()
export class PayGradesService {
  constructor(
    @InjectModel(payGrade.name)
    private readonly payGradeModel: Model<payGradeDocument>,
    private readonly allowancesService: AllowancesService,
  ) {}

  private async calculateTotalApprovedAllowances(): Promise<number> {
    const allAllowances = await this.allowancesService.findAllAllowances();
    const approvedAllowances = allAllowances.filter(allowance => allowance.status === ConfigStatus.APPROVED);
    return approvedAllowances.reduce((total, allowance) => total + (allowance.amount || 0), 0);
  }

  async createPayGrade(
    createPayGradeDto: CreatePayGradeDto,
    createdById: string,
  ): Promise<payGradeDocument> {
    const { grade, baseSalary } = createPayGradeDto;

    const existing = await this.payGradeModel.findOne({ grade }).exec();
    if (existing) {
      throw new BadRequestException('Pay grade with this name already exists');
    }

    // Calculate gross salary automatically
    const totalApprovedAllowances = await this.calculateTotalApprovedAllowances();
    const grossSalary = baseSalary + totalApprovedAllowances;

    const doc = new this.payGradeModel({
      grade,
      baseSalary,
      grossSalary,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    });

    return doc.save();
  }

  async findAllPayGrades(): Promise<payGradeDocument[]> {
    return this.payGradeModel.find().exec();
  }

  async findOnePayGrade(id: string): Promise<payGradeDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid pay grade id');
    }

    const doc = await this.payGradeModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Pay grade not found');
    }

    return doc;
  }

  async updatePayGrade(
    id: string,
    updatePayGradeDto: UpdatePayGradeDto,
  ): Promise<payGradeDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid pay grade id');
    }

    const doc = await this.payGradeModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Pay grade not found');
    }

    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException('Only draft pay grades can be edited');
    }

    // Apply updates if provided
    if (updatePayGradeDto.grade !== undefined) {
      doc.grade = updatePayGradeDto.grade;
    }
    if (updatePayGradeDto.baseSalary !== undefined) {
      doc.baseSalary = updatePayGradeDto.baseSalary;
    }

    // Recalculate gross salary automatically when base salary changes
    const totalApprovedAllowances = await this.calculateTotalApprovedAllowances();
    doc.grossSalary = doc.baseSalary + totalApprovedAllowances;

    return doc.save();
  }

  async approve(id: string, approverId: string) {
    const rule = await this.payGradeModel.findById(id);
    if (!rule) throw new NotFoundException('Pay grade not found');
    
    if (rule.status === ConfigStatus.APPROVED || rule.status === ConfigStatus.REJECTED) {
      throw new ForbiddenException('Approved/rejected pay grades cannot be approved');
    }
    rule.status = ConfigStatus.APPROVED;
    rule.approvedBy = new mongoose.Types.ObjectId(approverId);
    rule.approvedAt = new Date();

    return rule.save();
  }

  async reject(id: string, approverId: string) {
    const rule = await this.payGradeModel.findById(id);
    if (!rule) throw new NotFoundException('Pay grade not found');
    if (rule.status === ConfigStatus.APPROVED || rule.status === ConfigStatus.REJECTED) {
      throw new ForbiddenException('Approved/Rejected pay grades cannot be rejected');
    }

    rule.status = ConfigStatus.REJECTED;
    rule.approvedBy = new mongoose.Types.ObjectId(approverId);
    rule.approvedAt = new Date();

    return rule.save();
  }

  async delete(id: string) {
    const rule = await this.payGradeModel.findById(id);
    if (!rule) throw new NotFoundException('Pay grade not found');

    return this.payGradeModel.deleteOne({ _id: id }).exec();
  }
}
