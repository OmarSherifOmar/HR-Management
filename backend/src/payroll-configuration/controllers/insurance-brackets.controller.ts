
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { InsuranceBracketsService } from '../services/insurance-brackets.service';
import { CreateInsuranceBracketDto } from '../dtos/CreateInsuranceBracketDto';
import { UpdateInsuranceBracketDto } from '../dtos/UpdateInsuranceBracketDto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@Controller('payroll-configuration/insurance-brackets')
@UseGuards(AuthGuard, authorizationGuard)
export class InsuranceBracketsController {
  constructor(
    private readonly insuranceBracketsService: InsuranceBracketsService,
  ) {}

  @Post()
  @Roles(Role.PAYROLL_SPECIALIST)
  async create(@Body() dto: CreateInsuranceBracketDto, @Req() req: any) {
    const createdBy = req.user?._id;
    return this.insuranceBracketsService.create(dto, createdBy);
  }

  @Get()
  @Roles(Role.PAYROLL_SPECIALIST, Role.HR_MANAGER)
  async findAll() {
    return this.insuranceBracketsService.findAll();
  }

  @Get(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.HR_MANAGER)
  async findById(@Param('id') id: string) {
    return this.insuranceBracketsService.findById(id);
  }

  @Put(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceBracketDto,
    @Req() req: any,
  ) {
    const updatedBy = req.user?._id;
    return this.insuranceBracketsService.update(id, dto, updatedBy);
  }

  @Post(':id/approve')
  @Roles(Role.HR_MANAGER)
  async approve(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.insuranceBracketsService.approve(id, approverId);
  }

  @Post(':id/reject')
  @Roles(Role.HR_MANAGER)
  async reject(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.insuranceBracketsService.reject(id, approverId);
  }

  @Delete(':id')
  @Roles(Role.HR_MANAGER)
  async delete(@Param('id') id: string) {
    return this.insuranceBracketsService.delete(id);
  }
}
