import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ChangeRequestService } from '../services/change-request.service';
import { CreateChangeRequestDto } from '../dtos/create-change-request.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@UseGuards(RolesGuard)
@Controller('api/org/requests')
export class ChangeRequestController {
  constructor(private readonly svc: ChangeRequestService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('MANAGER', 'HR_EMPLOYEE', 'EMPLOYEE')
  async create(@Body() dto: CreateChangeRequestDto, @Req() req) {
    return this.svc.create(dto, req.user?.employeeId);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  async submit(@Param('id') id: string, @Req() req) {
    return this.svc.submit(id, req.user?.employeeId);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @Roles('HR_ADMIN', 'SYSTEM_ADMIN')
  async approve(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.svc.approve(id, req.user?.employeeId, 'APPROVED', comments);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @Roles('HR_ADMIN', 'SYSTEM_ADMIN')
  async reject(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.svc.reject(id, req.user?.employeeId, comments);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list() {
    return this.svc.list();
  }
}
