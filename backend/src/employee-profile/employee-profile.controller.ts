import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';

import { EmployeeService } from './employee-profile.service';
import { AuthGuard } from '../auth/guards/authentication.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeePublicDto } from './dto/employee-public.dto';
import { FindByEmailDto } from './dto/find-by-email.dto';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}


  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    const payload: any = (req as any).user;
    const userId = payload?.sub;
    if (!userId) {
      throw new BadRequestException('Invalid token payload: missing sub (user id)');
    }

    const user = await this.employeeService.findById(userId);
    if (!user) throw new NotFoundException('Employee not found');

    return new EmployeePublicDto(user);
  }

 
  @Get(':id')
  async getById(@Param('id') id: string) {
    if (!id) throw new BadRequestException('id is required');

    const user = await this.employeeService.findById(id);
    if (!user) throw new NotFoundException('Employee not found');

    return new EmployeePublicDto(user);
  }

 
  @Get('by-email')
  async getByEmail(@Query('q') email: string) {
    if (!email) throw new BadRequestException('email query parameter (q) is required');

    const user = await this.employeeService.findByEmail(email);
    if (!user) throw new NotFoundException('Employee not found');

    return new EmployeePublicDto(user);
  }

 
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEmployeeDto) {
    const email = (createDto as any).personalEmail ?? (createDto as any).workEmail;
    if (!email) throw new BadRequestException('personalEmail or workEmail is required');

    try {
      const created = await this.employeeService.create(createDto as any);
      return new EmployeePublicDto(created);
    } catch (err: any) {
      if (err?.code === 11000 || err?.message?.toLowerCase?.().includes('already exists')) {
        throw new ConflictException('Employee with that email or unique field already exists');
      }
      throw err;
    }
  }

  @Get(':id/roles')
  async getRoles(@Param('id') id: string) {
    if (!id) throw new BadRequestException('id is required');

    const roleDoc = await this.employeeService.getSystemRoleForEmployee(id as any);
    if (!roleDoc) throw new NotFoundException('No system role found for this employee');

    return {
      employeeProfileId: (roleDoc as any).employeeProfileId,
      roles: (roleDoc as any).roles ?? [],
      permissions: (roleDoc as any).permissions ?? [],
      isActive: (roleDoc as any).isActive ?? false,
    };
  }
}
