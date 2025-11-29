import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ChangeRequestService } from '../services/change-request.service';
import { CreateChangeRequestDto } from '../dtos/create-change-request.dto';
import { AuthGuard } from '../../auth/./guards/authentication.guard';
import { authorizationGuard } from '../../auth/./guards/authorization.guard';
import { Roles, Role } from '../../auth/./decorators/roles.decorator';

@UseGuards(authorizationGuard)
@Controller('api/org/requests')
export class ChangeRequestController {
  constructor(private readonly svc: ChangeRequestService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_EMPLOYEE, Role.DEPARTMENT_EMPLOYEE)
  async create(@Body() dto: CreateChangeRequestDto, @Req() req) {
    return this.svc.create(dto, req.user?.employeeId);
  }

  @Post(':id/submit')
  @UseGuards(AuthGuard)
  async submit(@Param('id') id: string, @Req() req) {
    return this.svc.submit(id, req.user?.employeeId);
  }

  @Post(':id/approve')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async approve(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.svc.approve(id, req.user?.employeeId, 'APPROVED', comments);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async reject(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.svc.reject(id, req.user?.employeeId, comments);
  }

  @Get()
  @UseGuards(AuthGuard)
  async list() {
    return this.svc.list();
  }
}
