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
  import { PayTypesService } from '../services/pay-types.service';
  import { CreatePayTypeDto } from '../dtos/create-pay-type.dto';
  import { UpdatePayTypeDto } from '../dtos/update-pay-type.dto';
  import { payTypeDocument } from '../models/payType.schema';
  import { AuthGuard } from '../../auth/guards/authentication.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { Role } from '../../auth/decorators/roles.decorator';
  
  @UseGuards(AuthGuard)
  @Controller('payroll-configuration/pay-types')
  export class PayTypesController {
    constructor(private readonly payTypesService: PayTypesService) {}
  
    @Roles(Role.PAYROLL_SPECIALIST)
    @Post()
    async createPayType(
      @Body() createPayTypeDto: CreatePayTypeDto,
      @Req() req: Request,
    ): Promise<payTypeDocument> {
      const user = req['user'];
      const createdById = user.sub;
      return this.payTypesService.createPayType(createPayTypeDto, createdById);
    }
  
    @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
    @Get()
    async getAllPayTypes(): Promise<payTypeDocument[]> {
      return this.payTypesService.findAllPayTypes();
    }
  
    @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
    @Get(':id')
    async getPayTypeById(
      @Param('id') id: string,
    ): Promise<payTypeDocument> {
      return this.payTypesService.findOnePayType(id);
    }
  
    @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
    @Patch(':id')
    async updatePayType(
      @Param('id') id: string,
      @Body() updatePayTypeDto: UpdatePayTypeDto,
    ): Promise<payTypeDocument> {
      return this.payTypesService.updatePayType(id, updatePayTypeDto);
    }

    @Post(':id/approve')
    @Roles(Role.Payroll_MANAGER)
    async approve(@Param('id') id: string, @Req() req: any) {
      const approverId = req.user?._id;
      return this.payTypesService.approve(id, approverId);
    }

    @Post(':id/reject')
    @Roles(Role.Payroll_MANAGER)
    async reject(@Param('id') id: string, @Req() req: any) {
      const approverId = req.user?._id;
      return this.payTypesService.reject(id, approverId);
    }

    @Delete(':id')
    @Roles(Role.Payroll_MANAGER)
    async delete(@Param('id') id: string) {
      return this.payTypesService.delete(id);
    }
  }
