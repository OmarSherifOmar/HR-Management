
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  UseGuards,
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
@Roles(Role.PAYROLL_SPECIALIST)
export class InsuranceBracketsController {
  constructor(
    private readonly insuranceBracketsService: InsuranceBracketsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateInsuranceBracketDto, @Req() req: any) {
    const createdBy = req.user?._id; // assume JWT auth middleware
    return this.insuranceBracketsService.create(dto, createdBy);
  }

  @Get()
  async findAll() {
    return this.insuranceBracketsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.insuranceBracketsService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceBracketDto,
    @Req() req: any,
  ) {
    const updatedBy = req.user?._id; // assume JWT auth middleware
    return this.insuranceBracketsService.update(id, dto, updatedBy);
  }
}
