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
  
    @Roles(Role.PAYROLL_SPECIALIST, Role.SYSTEM_ADMIN)
    @Post()
    async createPayType(
      @Body() createPayTypeDto: CreatePayTypeDto,
      @Req() req: Request,
    ): Promise<payTypeDocument> {
      const user = req['user'];
      const createdById = user.sub;
      return this.payTypesService.createPayType(createPayTypeDto, createdById);
    }
  
    @Get()
    async getAllPayTypes(): Promise<payTypeDocument[]> {
      return this.payTypesService.findAllPayTypes();
    }
  
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
  }
