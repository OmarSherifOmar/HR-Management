import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { payGrade, payGradeDocument } from '../models/payGrades.schema';
import { CreatePayGradeDto } from '../dtos/create-pay-grade.dto';
import { UpdatePayGradeDto } from '../dtos/update-pay-grade.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class PayGradesService {
  constructor(
    @InjectModel(payGrade.name)
    private readonly payGradeModel: Model<payGradeDocument>,
  ) {}

  async createPayGrade(
    createPayGradeDto: CreatePayGradeDto,
    createdById: string,
  ): Promise<payGradeDocument> {
    const { grade, baseSalary, grossSalary } = createPayGradeDto;

    const existing = await this.payGradeModel.findOne({ grade }).exec();
    if (existing) {
      throw new BadRequestException('Pay grade with this name already exists');
    }

    if (grossSalary < baseSalary) {
      throw new BadRequestException(
        'Gross salary must be greater than or equal to base salary',
      );
    }

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
    if (updatePayGradeDto.grossSalary !== undefined) {
      doc.grossSalary = updatePayGradeDto.grossSalary;
    }

    // After applying changes, re-validate the gross >= base rule
    if (doc.grossSalary < doc.baseSalary) {
      throw new BadRequestException(
        'Gross salary must be greater than or equal to base salary',
      );
    }

    return doc.save();
  }
}
