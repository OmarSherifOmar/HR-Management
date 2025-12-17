import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { AllowancesService } from '../services/allowances.service';
import { CreateAllowanceDto } from '../dtos/create-allowance.dto';
import { UpdateAllowanceDto } from '../dtos/update-allowance.dto';
import { allowanceDocument } from '../models/allowance.schema';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';

@UseGuards(AuthGuard)
@Controller('payroll-configuration/allowances')
export class AllowancesController {
  constructor(private readonly allowancesService: AllowancesService) {}

  @Roles(Role.PAYROLL_SPECIALIST)
  @Post()
  async createAllowance(
    @Body() createAllowanceDto: CreateAllowanceDto,
    @Req() req: Request,
  ): Promise<allowanceDocument> {
    const user = req['user'];
    const createdById = user.sub;
    return this.allowancesService.createAllowance(createAllowanceDto, createdById);
  }

  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Get()
  async getAllAllowances(): Promise<allowanceDocument[]> {
    return this.allowancesService.findAllAllowances();
  }

  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Get(':id')
  async getAllowanceById(
    @Param('id') id: string,
  ): Promise<allowanceDocument> {
    return this.allowancesService.findOneAllowance(id);
  }

  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Patch(':id')
  async updateAllowance(
    @Param('id') id: string,
    @Body() updateAllowanceDto: UpdateAllowanceDto,
  ): Promise<allowanceDocument> {
    return this.allowancesService.updateAllowance(id, updateAllowanceDto);
  }

  @Post(':id/approve')
  @Roles(Role.Payroll_MANAGER)
  async approve(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.allowancesService.approve(id, approverId);
  }

  @Post(':id/reject')
  @Roles(Role.Payroll_MANAGER)
  async reject(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.allowancesService.reject(id, approverId);
  }

  @Delete(':id')
  @Roles(Role.Payroll_MANAGER)
  async delete(@Param('id') id: string) {
    return this.allowancesService.delete(id);
  }
}
