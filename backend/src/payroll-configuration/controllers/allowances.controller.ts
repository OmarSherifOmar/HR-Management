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

  @Roles(Role.PAYROLL_SPECIALIST, Role.SYSTEM_ADMIN)
  @Post()
  async createAllowance(
    @Body() createAllowanceDto: CreateAllowanceDto,
    @Req() req: Request,
  ): Promise<allowanceDocument> {
    const user = req['user'];
    const createdById = user.sub;
    return this.allowancesService.createAllowance(createAllowanceDto, createdById);
  }

  @Get()
  async getAllAllowances(): Promise<allowanceDocument[]> {
    return this.allowancesService.findAllAllowances();
  }

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
}
