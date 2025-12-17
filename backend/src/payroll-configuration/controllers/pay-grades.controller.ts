import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PayGradesService } from '../services/pay-grades.service';
import { CreatePayGradeDto } from '../dtos/create-pay-grade.dto';
import { UpdatePayGradeDto } from '../dtos/update-pay-grade.dto';
import { payGradeDocument } from '../models/payGrades.schema';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';

@UseGuards(AuthGuard)
@Controller('payroll-configuration/pay-grades')
export class PayGradesController {
  constructor(private readonly payGradesService: PayGradesService) {}

  @Roles(Role.PAYROLL_SPECIALIST)
  @Post()
  async createPayGrade(
    @Body() createPayGradeDto: CreatePayGradeDto,
    @Req() req: Request,
  ): Promise<payGradeDocument> {
    const user = req['user'];
    const createdById = user.sub;
    return this.payGradesService.createPayGrade(createPayGradeDto, createdById);
  }

  @Get()
  async getAllPayGrades(): Promise<payGradeDocument[]> {
    return this.payGradesService.findAllPayGrades();
  }

  @Get(':id')
  async getPayGradeById(@Param('id') id: string): Promise<payGradeDocument> {
    return this.payGradesService.findOnePayGrade(id);
  }

  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Patch(':id')
  async updatePayGrade(
    @Param('id') id: string,
    @Body() updatePayGradeDto: UpdatePayGradeDto,
  ): Promise<payGradeDocument> {
    return this.payGradesService.updatePayGrade(id, updatePayGradeDto);
  }
}
