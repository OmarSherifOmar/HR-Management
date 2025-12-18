import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Delete,
  Req,
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
  @Roles(Role.PAYROLL_SPECIALIST)
    async createSigningBonus(
    @Body() createSigningBonusDto: CreateSigningBonusDto,
  ): Promise<signingBonusDocument> {
    return this.signingBonusesService.createSigningBonus(
      createSigningBonusDto,
    );
  }
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Get()
  async getAllSigningBonuses(): Promise<signingBonusDocument[]> {
    return this.signingBonusesService.findAllSigningBonuses();
  }
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Get(':id')
  async getSigningBonusById(
    @Param('id') id: string,
  ): Promise<signingBonusDocument> {
    return this.signingBonusesService.findOneSigningBonus(id);
  }

  @Patch(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async updateSigningBonus(
    @Param('id') id: string,
    @Body() updateSigningBonusDto: UpdateSigningBonusDto,
  ): Promise<signingBonusDocument> {
    return this.signingBonusesService.updateSigningBonus(
      id,
      updateSigningBonusDto,
    );
  }
    @Post(':id/approve')
    @Roles(Role.Payroll_MANAGER)
    async approve(@Param('id') id: string, @Req() req: any) {
      const approverId = req.user?._id;
      return this.signingBonusesService.approve(id, approverId);
    }
  
    @Post(':id/reject')
    @Roles(Role.Payroll_MANAGER)
    async reject(@Param('id') id: string, @Req() req: any) {
      const approverId = req.user?._id;
      return this.signingBonusesService.reject(id, approverId);
    }
  
    @Delete(':id')
    @Roles(Role.Payroll_MANAGER)
    async delete(@Param('id') id: string) {
      return this.signingBonusesService.delete(id);
    }
}