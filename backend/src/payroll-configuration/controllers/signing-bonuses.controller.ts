import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SigningBonusesService } from '../services/signing-bonuses.service';
import { CreateSigningBonusDto } from '../dtos/create-signing-bonus.dto';
import { UpdateSigningBonusDto } from '../dtos/update-signing-bonus.dto';
import { signingBonusDocument } from '../models/signingBonus.schema';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

@Controller('payroll-configuration/signing-bonuses')
@UseGuards(AuthGuard)
export class SigningBonusesController {
  constructor(
    private readonly signingBonusesService: SigningBonusesService,
  ) {}

  @Post()
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.SYSTEM_ADMIN)
  async createSigningBonus(
    @Body() createSigningBonusDto: CreateSigningBonusDto,
  ): Promise<signingBonusDocument> {
    return this.signingBonusesService.createSigningBonus(
      createSigningBonusDto,
    );
  }

  @Get()
  async getAllSigningBonuses(): Promise<signingBonusDocument[]> {
    return this.signingBonusesService.findAllSigningBonuses();
  }

  @Get(':id')
  async getSigningBonusById(
    @Param('id') id: string,
  ): Promise<signingBonusDocument> {
    return this.signingBonusesService.findOneSigningBonus(id);
  }

  @Patch(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.SYSTEM_ADMIN)
  async updateSigningBonus(
    @Param('id') id: string,
    @Body() updateSigningBonusDto: UpdateSigningBonusDto,
  ): Promise<signingBonusDocument> {
    return this.signingBonusesService.updateSigningBonus(
      id,
      updateSigningBonusDto,
    );
  }
}